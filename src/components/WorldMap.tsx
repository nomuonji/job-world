"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { WorldNodeView } from "@/lib/view";
import { WORLD, layoutWorldMap } from "@/lib/world-map";
import { RARITY_LABEL, FAMILIARITY_LABEL } from "@/lib/labels";
import type { Familiarity, Rarity } from "@/types";

/**
 * 全体マップ。トップページの主役。
 *
 * ページ遷移をしない。ノードを選ぶとフォーカスが移り、線とパネルが差し替わるだけ。
 * だから地図の形は一度も変わらず、見ているうちに「どこに何があるか」が頭に残る。
 *
 * 毛玉にしないための約束:
 *   - 常時描くエッジはゼロ。線はフォーカス中の職業から出る6本だけ。
 *   - ラベルもフォーカス中とその隣人だけ。他は絵文字のまま置く。
 *
 * 「フォーカス移動」は DOM の実フォーカスで実装している。
 * つまり Tab キーで隣を辿ることが、そのまま探索になる。
 */
export function WorldMap({
  nodes,
  industryOrder,
  industryLabels,
}: {
  nodes: WorldNodeView[];
  industryOrder: string[];
  industryLabels: [string, string][];
}) {
  const labelMap = useMemo(
    () => new Map(industryLabels),
    [industryLabels],
  );

  const { placements, regions, byS } = useMemo(
    () => layoutWorldMap(nodes, industryOrder, labelMap),
    [nodes, industryOrder, labelMap],
  );

  const [selected, setSelected] = useState<string | null>(null);
  const hitRefs = useRef(new Map<string, HTMLButtonElement | null>());

  const focusNode = useCallback((slug: string) => {
    setSelected(slug);
    // 実フォーカスも動かす。キーボードとマウスで同じ状態になる。
    hitRefs.current.get(slug)?.focus();
  }, []);

  const current = selected ? byS.get(selected)?.node : undefined;

  /** フォーカス中の職業とつながっている相手（線とラベルを出す対象）。 */
  const linkedSlugs = useMemo(() => {
    if (!current) return new Set<string>();
    return new Set(current.edges.map((e) => e.slug));
  }, [current]);

  return (
    <div>
      {/*
        SVG は見た目だけを担い、操作と読み上げは上に重ねた HTML のボタンが担当する。
        SVG要素に tabindex を付けても動きはするが、
        ボタンにしておくほうが role とフォーカスリングが標準のまま使えて、
        スクリーンリーダーの扱いも素直になる。
        viewBox が正方形で width:100% なので、絶対配置の % 座標が丸の中心と一致する。
      */}
      <div className="world-scroll -mx-4 sm:mx-0">
        <div className="world-canvas relative">
        <svg
          viewBox={`0 0 ${WORLD.size} ${WORLD.size}`}
          className="h-auto w-full"
          aria-hidden="true"
          focusable="false"
        >
          {/* 既知度の目盛り。中心が知っている仕事、外へ行くほど知らない仕事。 */}
          {[1, 2, 3, 4, 5].map((f) => {
            const t = (5 - f) / 4;
            const r =
              WORLD.innerRadius + t * (WORLD.outerRadius - WORLD.innerRadius);
            return (
              <circle
                key={f}
                cx={WORLD.cx}
                cy={WORLD.cy}
                r={r}
                fill="none"
                stroke="var(--border)"
                strokeWidth={1}
                opacity={0.5}
              />
            );
          })}

          <text
            x={WORLD.cx}
            y={WORLD.cy - 6}
            textAnchor="middle"
            fontSize={17}
            fill="var(--muted)"
          >
            誰でも知っている
          </text>
          <text
            x={WORLD.cx}
            y={WORLD.cy + 16}
            textAnchor="middle"
            fontSize={17}
            fill="var(--muted)"
          >
            ↓ 外へ行くほど知られていない
          </text>

          {/* 業界の名前。地図の「地名」にあたる。 */}
          {regions.map((region) => (
            <text
              key={region.industryId}
              x={region.labelX}
              y={region.labelY}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={19}
              fill="var(--muted)"
              opacity={0.9}
            >
              {region.labelJa}
            </text>
          ))}

          {/* 線はフォーカス中の職業からしか出さない。ここが毛玉にしない要。 */}
          {current &&
            current.edges.map((edge) => {
              const from = byS.get(current.slug);
              const to = byS.get(edge.slug);
              if (!from || !to) return null;
              return (
                <g key={`edge-${edge.slug}`}>
                  <line
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke={`var(--facet-${edge.dominantFacet})`}
                    strokeWidth={2.5}
                    opacity={0.7}
                  />
                  {edge.sharedLabelJa && (
                    <text
                      x={(from.x + to.x) / 2}
                      y={(from.y + to.y) / 2 - 6}
                      textAnchor="middle"
                      fontSize={15}
                      fill="var(--foreground)"
                      stroke="var(--background)"
                      strokeWidth={4}
                      paintOrder="stroke"
                    >
                      {edge.sharedLabelJa}
                    </text>
                  )}
                </g>
              );
            })}

          {/* ノード */}
          {placements.map(({ node, x, y, anchor }) => {
            const isCurrent = node.slug === selected;
            const isLinked = linkedSlugs.has(node.slug);
            const dim = selected !== null && !isCurrent && !isLinked;
            const r = isCurrent ? WORLD.focusNodeRadius : WORLD.nodeRadius;

            return (
              <g
                key={node.slug}
                data-slug={node.slug}
                className={`world-node${dim ? " is-dim" : ""}${
                  isCurrent ? " is-current" : ""
                }`}
              >
                <circle
                  cx={x}
                  cy={y}
                  r={r}
                  fill="var(--surface)"
                  stroke={
                    isCurrent ? "var(--accent)" : `var(--facet-industry)`
                  }
                  strokeWidth={isCurrent ? 4 : 2}
                />
                <text
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={isCurrent ? 26 : 18}
                >
                  {node.emoji}
                </text>

                {/* ラベルはフォーカス中とその隣人だけ。他は絵文字のまま。 */}
                {(isCurrent || isLinked) && (
                  <text
                    x={anchor === "start" ? x + r + 5 : x - r - 5}
                    y={y + 5}
                    textAnchor={anchor}
                    fontSize={isCurrent ? 20 : 17}
                    fontWeight={isCurrent ? 700 : 600}
                    fill="var(--foreground)"
                    stroke="var(--background)"
                    strokeWidth={4}
                    paintOrder="stroke"
                  >
                    {node.nameJa}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* 当たり判定と読み上げ。見た目は透明で、SVGの丸の真上に重なる。 */}
        <div className="absolute inset-0">
          {placements.map(({ node, x, y }) => (
            <button
              key={node.slug}
              type="button"
              ref={(el) => {
                hitRefs.current.set(node.slug, el);
              }}
              data-slug={node.slug}
              aria-pressed={node.slug === selected}
              aria-label={`${node.nameJa}。${node.summaryJa}`}
              title={`${node.nameJa} — ${node.summaryJa}`}
              className="world-hit"
              style={{
                left: `${(x / WORLD.size) * 100}%`,
                top: `${(y / WORLD.size) * 100}%`,
              }}
              onClick={() => focusNode(node.slug)}
              onFocus={() => setSelected(node.slug)}
            />
          ))}
          </div>
        </div>
      </div>

      <DetailPanel
        current={current}
        byS={byS}
        onPick={focusNode}
        onClear={() => setSelected(null)}
      />
    </div>
  );
}

function DetailPanel({
  current,
  byS,
  onPick,
  onClear,
}: {
  current: WorldNodeView | undefined;
  byS: Map<string, { node: WorldNodeView }>;
  onPick: (slug: string) => void;
  onClear: () => void;
}) {
  if (!current) {
    return (
      <p className="mt-2 text-center text-sm text-[var(--muted)]">
        丸をえらぶと、その仕事とつながっている仕事に線が引かれます。
        <span className="hidden sm:inline">
          {" "}
          Tabキーでも辿れます。ページは移動しません。
        </span>
      </p>
    );
  }

  return (
    <div
      className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="text-3xl">
          {current.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold">{current.nameJa}</h3>
          <p className="text-sm text-[var(--muted)]">{current.summaryJa}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {RARITY_LABEL[current.rarity as Rarity]} ／{" "}
            {FAMILIARITY_LABEL[current.familiarity as Familiarity]}
          </p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="shrink-0 text-xs text-[var(--muted)] underline hover:text-[var(--accent)]"
        >
          選択を解除
        </button>
      </div>

      <p className="mt-4 text-sm font-bold">つながっている仕事</p>
      <ul className="mt-2 grid gap-2 sm:grid-cols-2">
        {current.edges.map((edge) => {
          const node = byS.get(edge.slug)?.node;
          if (!node) return null;
          return (
            <li key={edge.slug}>
              {/* ここもページ遷移しない。地図の上でフォーカスが移るだけ。 */}
              <button
                type="button"
                onClick={() => onPick(edge.slug)}
                className="w-full rounded-lg border border-[var(--border)] p-2.5 text-left transition-colors hover:border-[var(--accent)]"
              >
                <span className="font-semibold">
                  <span aria-hidden="true">{node.emoji}</span> {node.nameJa}
                </span>
                <span className="mt-0.5 block text-xs text-[var(--muted)]">
                  <span style={{ color: `var(--facet-${edge.dominantFacet})` }}>
                    {edge.sharedLabelJa ?? "近い性質"}
                  </span>
                  {" — "}
                  {edge.reasonJa}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <Link
        href={`/jobs/${current.slug}`}
        className="mt-4 inline-block text-sm font-semibold text-[var(--accent)] underline"
      >
        {current.nameJa}のページを読む →
      </Link>
    </div>
  );
}
