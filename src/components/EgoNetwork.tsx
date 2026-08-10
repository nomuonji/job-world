"use client";

import {
  useCallback,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { useRouter } from "next/navigation";
import {
  readQueryParam,
  replaceQueryParam,
  serverQueryParam,
  subscribeQuery,
} from "@/lib/url-state";
import type { Facet, FacetId } from "@/types";
import type { EgoCenterView, EgoNodeView } from "@/lib/view";
import { VIEW, layoutEgoNetwork, truncate } from "@/lib/layout";
import { pushTrail } from "@/lib/trail";

/**
 * エゴネットワーク図。
 *
 * この図は「装飾」であり、意味を運ぶ経路は下の NeighborList のリンクリストが唯一。
 * よって SVG は aria-hidden にして二重読み上げを避ける。図を消しても辿れることが
 * v1 の受け入れ基準に入っている。
 *
 * 物理シミュレーションは使わない（理由は lib/layout.ts の冒頭を参照）。
 * 決定論的な配置なので、同じ職業に戻ってくると必ず同じ絵になる。
 */

/** 表示件数。モバイルでは外リングをCSSで隠して内リングだけにする。 */
const INNER_COUNT = 8;
const VISIBLE_COUNT = 14;

export function EgoNetwork({
  center,
  nodes,
  facets,
}: {
  center: EgoCenterView;
  nodes: EgoNodeView[];
  facets: Facet[];
}) {
  const router = useRouter();

  /*
   * 軸の選択は URL（外部ストア）から読む。
   *
   * useSearchParams を使わないのは意図的。使うと Suspense 境界が
   * プリレンダリング時に fallback を返してしまい、図が初期HTMLに載らなくなる。
   * 図をサーバー側で描いておけることは決定論的レイアウトを選んだ理由そのものなので、
   * そちらを優先する。サーバー側スナップショットは常に null なので、
   * hydration 前は必ず「すべて」の状態で描かれる。
   */
  const activeFacet = useSyncExternalStore(
    subscribeQuery,
    () => readQueryParam("facet"),
    serverQueryParam,
  ) as FacetId | null;

  // 遷移アニメーションの2フェーズ。クリックされたノードへ寄っていく感覚を作る。
  const [leavingTo, setLeavingTo] = useState<string | null>(null);

  // 軸で絞ると、同じ職業の周りに違う世界が現れる。
  const visible = useMemo(() => {
    const pool = activeFacet
      ? nodes.filter((n) => (n.byFacet[activeFacet] ?? 0) > 0)
      : nodes;
    const sorted = activeFacet
      ? [...pool].sort(
          (a, b) => (b.byFacet[activeFacet] ?? 0) - (a.byFacet[activeFacet] ?? 0),
        )
      : pool;
    return sorted.slice(0, VISIBLE_COUNT);
  }, [nodes, activeFacet]);

  const { nodes: placed, sectors } = useMemo(
    () => layoutEgoNetwork(visible, facets, INNER_COUNT),
    [visible, facets],
  );

  const facetById = useMemo(
    () => new Map(facets.map((f) => [f.id, f])),
    [facets],
  );

  const go = useCallback(
    (node: EgoNodeView) => {
      pushTrail({
        slug: center.slug,
        nameJa: center.nameJa,
        emoji: center.emoji,
      });
      setLeavingTo(node.slug);
      // フェーズ1のあいだにルーターを走らせる。prefetch が効いていれば体感は即時。
      router.push(`/jobs/${node.slug}?from=${center.slug}`);
    },
    [center, router],
  );

  const setFacet = useCallback(
    (facet: FacetId | null) => {
      replaceQueryParam(`/jobs/${center.slug}`, "facet", facet);
    },
    [center.slug],
  );

  if (nodes.length === 0) return null;

  return (
    <div>
      {/* 軸の絞り込み。同じ職業から違う世界が見えることを体験させる装置。 */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        <FacetChip
          label="すべて"
          active={!activeFacet}
          onClick={() => setFacet(null)}
        />
        {facets.map((facet) => {
          const count = nodes.filter(
            (n) => (n.byFacet[facet.id] ?? 0) > 0,
          ).length;
          if (count === 0) return null;
          return (
            <FacetChip
              key={facet.id}
              label={`${facet.emoji} ${facet.labelJa}`}
              color={`var(--facet-${facet.id})`}
              active={activeFacet === facet.id}
              onClick={() => setFacet(facet.id)}
            />
          );
        })}
      </div>

      <div
        className="-mx-4 sm:mx-0"
        style={
          activeFacet
            ? {
                background: `color-mix(in srgb, var(--facet-${activeFacet}) 7%, transparent)`,
              }
            : undefined
        }
      >
        <svg
          viewBox={`0 0 ${VIEW.size} ${VIEW.size}`}
          className={`h-auto w-full ego-svg${leavingTo ? " is-leaving" : ""}`}
          aria-hidden="true"
          focusable="false"
        >
          {/* 軸ラベル。「上を見れば体の使い方が同じ仕事」と読めるようにする。 */}
          {sectors.map((sector) => {
            const facet = facetById.get(sector.facet);
            if (!facet) return null;
            return (
              <text
                key={sector.facet}
                x={sector.labelX}
                y={sector.labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={19}
                opacity={0.75}
                fill={`var(--facet-${facet.id})`}
                className="ego-sector"
              >
                {facet.emoji} {facet.labelJa}でつながる
              </text>
            );
          })}

          {/* エッジ。中心からの放射のみ。周囲ノード同士は結ばない（毛玉にしない）。 */}
          {placed.map(({ neighbor, x, y, ring }) => (
            <line
              key={`edge-${neighbor.slug}`}
              x1={VIEW.cx}
              y1={VIEW.cy}
              x2={x}
              y2={y}
              stroke={`var(--facet-${neighbor.dominantFacet})`}
              strokeWidth={neighbor.typedLabelJa ? 3.5 : 2}
              strokeDasharray={neighbor.typedLabelJa ? "8 5" : undefined}
              opacity={0.45}
              className={ring === "outer" ? "ego-outer" : undefined}
            />
          ))}

          {/* 共有タグのピル。「なぜ繋がっているか」を線の上に直接置く。 */}
          {placed.map(({ neighbor, x, y, ring }) => {
            const label = neighbor.sharedLabelJa;
            if (!label) return null;
            const mx = VIEW.cx + (x - VIEW.cx) * 0.52;
            const my = VIEW.cy + (y - VIEW.cy) * 0.52;
            const width = Array.from(label).length * 15 + 16;
            return (
              <g
                key={`pill-${neighbor.slug}`}
                className={`ego-pill${ring === "outer" ? " ego-outer" : ""}`}
              >
                <rect
                  x={mx - width / 2}
                  y={my - 13}
                  width={width}
                  height={26}
                  rx={13}
                  fill="var(--surface)"
                  stroke={`var(--facet-${neighbor.dominantFacet})`}
                  strokeWidth={1.5}
                />
                <text
                  x={mx}
                  y={my}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={15}
                  fill="var(--foreground)"
                >
                  {label}
                </text>
              </g>
            );
          })}

          {/* 周囲のノード */}
          {placed.map(({ neighbor, x, y, anchor, ring }) => {
            const labelX =
              anchor === "middle"
                ? x
                : anchor === "start"
                  ? x + VIEW.nodeRadius + 6
                  : x - VIEW.nodeRadius - 6;
            const labelY =
              anchor === "middle" ? y + VIEW.nodeRadius + 22 : y + 6;

            return (
              <a
                key={neighbor.slug}
                href={`/jobs/${neighbor.slug}?from=${center.slug}`}
                onClick={(event) => {
                  event.preventDefault();
                  go(neighbor);
                }}
                className={`ego-node${ring === "outer" ? " ego-outer" : ""}${
                  leavingTo === neighbor.slug ? " is-target" : ""
                }`}
              >
                {/* 子を複数書くと React 19 が中身を落とすので、必ず単一の文字列で渡す。 */}
                <title>{`${neighbor.nameJa} — ${neighbor.reasonJa}`}</title>
                <circle
                  cx={x}
                  cy={y}
                  r={VIEW.nodeRadius}
                  fill="var(--surface)"
                  stroke={`var(--facet-${neighbor.dominantFacet})`}
                  strokeWidth={2.5}
                />
                <text
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={28}
                >
                  {neighbor.emoji}
                </text>
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor={anchor}
                  fontSize={19}
                  fontWeight={600}
                  fill="var(--foreground)"
                  stroke="var(--background)"
                  strokeWidth={4}
                  paintOrder="stroke"
                >
                  {truncate(neighbor.nameJa)}
                </text>
              </a>
            );
          })}

          {/* 中心ノード */}
          <circle
            cx={VIEW.cx}
            cy={VIEW.cy}
            r={VIEW.centerNodeRadius}
            fill="var(--accent-soft)"
            stroke="var(--accent)"
            strokeWidth={3}
          />
          <text
            x={VIEW.cx}
            y={VIEW.cy}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={44}
          >
            {center.emoji}
          </text>
          <text
            x={VIEW.cx}
            y={VIEW.cy + VIEW.centerNodeRadius + 26}
            textAnchor="middle"
            fontSize={22}
            fontWeight={700}
            fill="var(--foreground)"
            stroke="var(--background)"
            strokeWidth={5}
            paintOrder="stroke"
          >
            {center.nameJa}
          </text>
        </svg>
      </div>

      <p className="px-4 text-center text-xs text-[var(--muted)] sm:px-0">
        丸をおすと、その仕事が中心になります。
        <span className="hidden sm:inline">
          {" "}
          線の上の言葉が、つながっている理由です。
        </span>
      </p>
    </div>
  );
}

function FacetChip({
  label,
  color,
  active,
  onClick,
}: {
  label: string;
  color?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="rounded-full border px-3 py-1 text-sm transition-colors"
      style={{
        color: active ? "var(--background)" : (color ?? "var(--foreground)"),
        backgroundColor: active ? (color ?? "var(--accent)") : "transparent",
        borderColor: color ?? "var(--border)",
      }}
    >
      {label}
    </button>
  );
}
