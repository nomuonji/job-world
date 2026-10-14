"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import Link from "next/link";
import type { WorldNodeView } from "@/lib/view";
import { RelationshipMap } from "@/components/RelationshipMap";
import { WORLD, layoutWorldMap } from "@/lib/world-map";

/**
 * The atlas is intentionally a spatial map, not a list posing as one:
 * direction = industry, distance from the center = editorial familiarity,
 * and the only drawn links are those of the selected occupation.
 * SVG draws the terrain and all 150 locations; HTML provides an accessible
 * search, a select, and an always legible explanation of the selected links.
 */
export function WorldAtlas({
  nodes,
  industryOrder,
  industryLabels,
}: {
  nodes: WorldNodeView[];
  industryOrder: string[];
  industryLabels: [string, string][];
}) {
  const labels = useMemo(() => new Map(industryLabels), [industryLabels]);
  const { placements, regions, byS } = useMemo(
    () => layoutWorldMap(nodes, industryOrder, labels),
    [nodes, industryOrder, labels],
  );
  const [selected, setSelected] = useState(
    () => nodes.find((n) => n.familiarity >= 4)?.slug ?? nodes[0]?.slug ?? "",
  );
  const [query, setQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [tilted, setTilted] = useState(true);
  const [hovered, setHovered] = useState<string | null>(null);
  const [lens, setLens] = useState<"all" | "industry" | "network">("network");
  // A route is made only of confirmed graph edges, never a fabricated career path.
  const [route, setRoute] = useState<string[]>(() => [
    nodes.find((node) => node.familiarity >= 4)?.slug ?? nodes[0]?.slug ?? "",
  ]);

  const current = byS.get(selected)?.node;
  const focus = byS.get(selected);
  const edges = current?.edges
    .map((edge) => ({ edge, target: byS.get(edge.slug) }))
    .filter((entry) => entry.target !== undefined) ?? [];
  const linked = new Set(edges.map((entry) => entry.edge.slug));
  const selectedIndustry = current?.industryId;
  const industryCounts = useMemo(() =>
    new Map(regions.map((region) => [region.industryId, region.count])),
    [regions],
  );
  const nextSurprise = (() => {
    if (!current) return undefined;
    return current.edges
      .map((edge) => byS.get(edge.slug)?.node)
      .filter((node): node is WorldNodeView => Boolean(node))
      .sort((a, b) =>
        Number(b.industryId !== current.industryId) - Number(a.industryId !== current.industryId) ||
        a.familiarity - b.familiarity ||
        b.rarity - a.rarity ||
        a.slug.localeCompare(b.slug),
      )[0];
  })();
  const facetLabels: Record<string, string> = {
    setting: "働く場所",
    subject: "扱うもの",
    action: "動作",
    sense: "使う感覚",
    condition: "働く条件",
    temperament: "向いている気質",
    industry: "業界",
  };
  const facetColors: Record<string, string> = {
    setting: "#78d6bd",
    subject: "#e2ad7e",
    action: "#f3a1b8",
    sense: "#c2a0ef",
    condition: "#8cbcf5",
    temperament: "#ead27d",
    industry: "#c5d2d8",
  };

  const results = useMemo(
    () => query.trim()
      ? nodes.filter((node) =>
          (node.nameJa + " " + node.summaryJa).toLocaleLowerCase("ja")
            .includes(query.trim().toLocaleLowerCase("ja")),
        ).slice(0, 9)
      : [],
    [nodes, query],
  );

  const size = WORLD.size / zoom;
  const x = zoom > 1 && focus
    ? Math.max(0, Math.min(WORLD.size - size, focus.x - size / 2))
    : (WORLD.size - size) / 2;
  const y = zoom > 1 && focus
    ? Math.max(0, Math.min(WORLD.size - size, focus.y - size / 2))
    : (WORLD.size - size) / 2;

  // When selecting from the inspector/search on narrow screens, show its actual
  // location on the scrollable terrain rather than leaving it outside the viewport.
  useEffect(() => {
    const viewport = scrollRef.current;
    if (!viewport || !focus || viewport.scrollWidth <= viewport.clientWidth) return;
    const location = ((focus.x - x) / size) * viewport.scrollWidth;
    const left = Math.max(0, location - viewport.clientWidth / 2);
    viewport.scrollTo({
      left,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }, [selected, zoom, focus, x, size]);

  const select = (slug: string, follow = false) => {
    if (!byS.has(slug)) return;
    const isNeighbor = current?.edges.some((edge) => edge.slug === slug) ?? false;
    if (slug !== selected) {
      setRoute((previous) =>
        follow && isNeighbor ? [...previous, slug].slice(-6) : [slug],
      );
    }
    setSelected(slug);
    setHovered(null);
    setQuery("");
  };
  const navigateBack = (index: number) => {
    const destination = route[index];
    if (!destination) return;
    setRoute(route.slice(0, index + 1));
    setSelected(destination);
    setHovered(null);
  };
  const pickIndustry = (industryId: string) => {
    const first = nodes
      .filter((node) => node.industryId === industryId)
      .sort((a, b) => b.familiarity - a.familiarity || a.slug.localeCompare(b.slug))[0];
    if (first) {
      select(first.slug);
      setLens("industry");
    }
  };

  const displayed = hovered ? byS.get(hovered)?.node : current;
  const relationItems = edges.flatMap(({edge,target}) => target ? [{
    node:target.node,
    shared:edge.sharedLabelJa ?? edge.reasonJa,
    facetLabel:facetLabels[edge.dominantFacet] ?? "共通する特徴",
    color:facetColors[edge.dominantFacet] ?? "#a5efd1",
  }] : []);

  return (
    <div className="world-atlas">
      <div className="world-atlas-bar">
        <div className="world-atlas-find">
          <label htmlFor="world-atlas-search">どこから探索する？</label>
          <input
            id="world-atlas-search"
            type="search"
            placeholder="職業名・仕事内容で検索"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoComplete="off"
          />
          {query && (
            <div className="world-atlas-results" aria-label="職業検索結果">
              {results.length
                ? results.map((node) => (
                    <button type="button" key={node.slug} onClick={() => select(node.slug)}>
                      <span>{node.emoji} {node.nameJa}</span><span aria-hidden="true">→</span>
                    </button>
                  ))
                : <p>該当する職業がありません。</p>}
            </div>
          )}
        </div>
        <div className="world-atlas-tools">
          <label htmlFor="world-atlas-select" className="world-atlas-sr">地図で選ぶ職業</label>
          <select
            id="world-atlas-select"
            value={selected}
            onChange={(event) => select(event.target.value)}
            aria-label="地図で選ぶ職業"
          >
            {nodes.map((node) => (
              <option value={node.slug} key={node.slug}>{node.nameJa}</option>
            ))}
          </select>
          {lens !== "network" && <div className="world-atlas-tool-buttons" role="group" aria-label="地図の表示操作">
            <button type="button" onClick={() => setZoom((z) => Math.max(1, Math.round((z - 0.25) * 100) / 100))} disabled={zoom === 1} aria-label="縮小">−</button>
            <span aria-live="polite">{Math.round(zoom * 100)}%</span>
            <button type="button" onClick={() => setZoom((z) => Math.min(2, Math.round((z + 0.25) * 100) / 100))} disabled={zoom === 2} aria-label="拡大">＋</button>
            <button type="button" className="world-atlas-tilt" aria-pressed={tilted} onClick={() => setTilted((value) => !value)}>{tilted ? "俯瞰に戻す" : "立体表示"}</button>
          </div>}
        </div>
      </div>

      {lens !== "network" && <nav className="world-atlas-sectors" aria-label="業界から仕事を探す">
        <span className="world-atlas-sectors-caption">AREAS / 業界</span>
        {industryOrder.filter((industryId) => industryCounts.has(industryId)).map((industryId) => (
          <button
            type="button"
            key={industryId}
            aria-pressed={industryId === selectedIndustry && lens === "industry"}
            className={industryId === selectedIndustry ? "is-current" : ""}
            onClick={() => pickIndustry(industryId)}
          >
            {labels.get(industryId) ?? industryId}
            <small>{industryCounts.get(industryId)}</small>
          </button>
        ))}
      </nav>}
      <div className="world-atlas-body">
        <div className="world-atlas-stage">
          <div className="world-atlas-stage-heading">
            <span>{lens === "network" ? "CONNECTIONS / 仕事のつながりを解く" : `OCCUPATION UNIVERSE / ${nodes.length} POINTS`}</span>
<div className="world-atlas-lenses" role="group" aria-label="地図の見せ方">
              {[
                ["network", "関係を読む"],
                ["all", "全体地図"],
                ["industry", "業界地図"],
              ].map(([value, title]) => (
                <button
                  type="button"
                  key={value}
                  aria-pressed={lens === value}
                  onClick={() => setLens(value as "all" | "industry" | "network")}
                >{title}</button>
              ))}
            </div>
          </div>
          {lens === "network" && current ? (
            <RelationshipMap
              current={current}
              related={relationItems}
              hovered={hovered}
              onHover={setHovered}
              onSelect={(slug) => select(slug, true)}
              onOverview={() => {setLens("all"); setZoom(1);}}
            />
          ) : (
          <>
          <div className="world-atlas-scroll" ref={scrollRef}>
            <div className={`world-atlas-plane${tilted ? " is-tilted" : ""}`}>
              <svg
                viewBox={`${x} ${y} ${size} ${size}`}
                role="group"
                aria-label="150職業を業界と知名度で配置した地図。各職業を選択でき、選択した仕事の関係線が表示されます。"
                className="world-atlas-svg"
              >
                <defs>
                  <radialGradient id="world-map-ground">
                    <stop offset="0%" stopColor="#29465a" />
                    <stop offset="62%" stopColor="#152b3e" />
                    <stop offset="100%" stopColor="#0b1a2b" />
                  </radialGradient>
                  <filter id="world-node-glow" x="-100%" y="-100%" width="300%" height="300%">
                    <feGaussianBlur stdDeviation="12" />
                  </filter>
                  <linearGradient id="world-node-cap" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#fff0cd" />
                    <stop offset="100%" stopColor="#9fd8c5" />
                  </linearGradient>
                </defs>
                {/* Extruded base and radial relief are meaningful geography, not decoration. */}
                <circle cx={500} cy={520} r={455} fill="#020c16" opacity=".95" />
                <circle cx={500} cy={509} r={451} stroke="#5c8193" strokeWidth="2" fill="#071522" />
                <circle cx={500} cy={499} r={450} stroke="#426076" strokeWidth="2" fill="url(#world-map-ground)" />
                {regions.map((region, index) => {
                  const angle = region.midAngle;
                  const half = (region.count / Math.max(1, nodes.length)) * 180;
                  const rad = (deg: number) => deg * Math.PI / 180;
                  const point = (r: number, a: number) =>
                    `${500 + Math.cos(rad(a)) * r} ${500 + Math.sin(rad(a)) * r}`;
                  const start = angle - half + 0.5;
                  const end = angle + half - 0.5;
                  const path = `M ${point(135, start)} L ${point(443, start)} A 443 443 0 ${end - start > 180 ? 1 : 0} 1 ${point(443, end)} L ${point(135, end)} A 135 135 0 ${end - start > 180 ? 1 : 0} 0 ${point(135, start)} Z`;
                  const isActive = region.industryId === selectedIndustry;
                  // Tiny sectors receive their names in the area rail instead of overlapping here.
                  const showLabel = (region.count / Math.max(nodes.length, 1)) * 360 >= 19
                    && (lens !== "industry" || isActive);
                  const palette = ["#5daca0", "#6e95bd", "#c49b6d", "#a282b3", "#7899ad", "#b6a781", "#76a99e", "#ab8794"];
                  return (
                    <g key={region.industryId}>
                      <path
                        d={path}
                        fill={palette[index % palette.length]}
                        opacity={isActive ? (lens === "network" ? ".1" : ".32") : lens === "all" ? ".1" : ".035"}
                        stroke={isActive ? "#a9edcf" : "none"}
                        strokeWidth={isActive ? 2.5 : 0}
                        className="world-atlas-sector"
                        role="button"
                        tabIndex={0}
                        aria-label={`${region.labelJa}を探索。収録${region.count}職業`}
                        onClick={() => pickIndustry(region.industryId)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            pickIndustry(region.industryId);
                          }
                        }}
                      >
                        <title>{region.labelJa}：{region.count}職業。この領域を探索</title>
                      </path>
                      <line x1={500} y1={500} x2={500 + Math.cos(rad(start)) * 448} y2={500 + Math.sin(rad(start)) * 448} stroke="#9cb8c1" strokeOpacity=".18" />
                      {showLabel && (
                        <text
                          x={500 + (region.labelX - 500) * .87}
                          y={500 + (region.labelY - 500) * .87}
                          className={`world-atlas-region${isActive ? " is-active" : ""}`}
                          textAnchor="middle"
                          dominantBaseline="central"
                        >{region.labelJa}</text>
                      )}
                    </g>
                  );
                })}
                {[1, 2, 3, 4, 5].map((f) => {
                  const radius = WORLD.innerRadius + ((5 - f) / 4) * (WORLD.outerRadius - WORLD.innerRadius);
                  return <circle key={f} cx={500} cy={500} r={radius} fill="none" stroke="#98b8c4" strokeWidth={1.4} strokeOpacity=".28" strokeDasharray={f === 5 ? undefined : "3 7"} />;
                })}
                <circle cx={500} cy={500} r={85} fill="#132e40" stroke="#8bb5bb" strokeOpacity=".4" />
                <text x={500} y={491} textAnchor="middle" fill="#dbe9e5" fontSize={17} fontWeight={750}>よく知られた</text>
                <text x={500} y={516} textAnchor="middle" fill="#dbe9e5" fontSize={17} fontWeight={750}>仕事</text>

                {/* The gold path records actual choices only if successive jobs are linked. */}
                {route.slice(1).map((slug, i) => {
                  const before = byS.get(route[i]);
                  const after = byS.get(slug);
                  if (!before || !after ||
                    !before.node.edges.some((edge) => edge.slug === slug)) return null;
                  return <line
                    key={`route-${i}`}
                    className="world-atlas-route-line"
                    x1={before.x} y1={before.y} x2={after.x} y2={after.y}
                    stroke="#f3d795" strokeWidth={4} strokeDasharray="7 7"
                    strokeLinecap="round" opacity=".72"
                  />;
                })}
                {edges.map(({ edge, target }) => {
                  if (!focus || !target) return null;
                  const midX = (focus.x + target.x) / 2;
                  const midY = (focus.y + target.y) / 2;
                  return (
                    <g key={edge.slug}>
                      <path d={`M ${focus.x} ${focus.y} Q ${midX + (500 - midX) * .12} ${midY + (500 - midY) * .12} ${target.x} ${target.y}`} fill="none" stroke={facetColors[edge.dominantFacet] ?? "#a5efd1"} strokeOpacity={hovered === edge.slug ? "1" : ".88"} strokeWidth={hovered === edge.slug ? 7 : 4} strokeLinecap="round" />
                      <circle cx={target.x} cy={target.y} r={23} fill="#79dfc4" opacity=".26" filter="url(#world-node-glow)" />
                    </g>
                  );
                })}

                {placements.map(({ node, x: px, y: py }) => {
                  const isCurrent = node.slug === selected;
                  const isLinked = linked.has(node.slug);
                  const isHovered = node.slug === hovered;
                  const muted = lens === "industry"
                    ? node.industryId !== selectedIndustry && !isLinked && !isCurrent
                    : lens === "network" && !isLinked && !isCurrent;
                  const r = isCurrent ? 20 : isLinked ? 13 : 6.2;
                  const key = (event: KeyboardEvent<SVGGElement>) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      select(node.slug);
                    }
                  };
                  return (
                    <g
                      key={node.slug}
                      className={`world-atlas-node${isCurrent ? " is-current" : ""}${isLinked ? " is-linked" : ""}${hovered === node.slug ? " is-hovered" : ""}${muted ? " is-muted" : ""}`}
                      transform={`translate(${px} ${py})`}
                      role="button"
                      tabIndex={isCurrent || isLinked ? 0 : -1}
                      aria-label={`${node.nameJa}。地図で選択する`}
                      aria-pressed={isCurrent}
                      onClick={() => select(node.slug, isLinked)}
                      onKeyDown={key}
                      onMouseEnter={() => setHovered(node.slug)}
                      onMouseLeave={() => setHovered(null)}
                      onFocus={() => setHovered(node.slug)}
                      onBlur={() => setHovered(null)}
                    >
                      <circle cy={7} r={r + 2} fill="#061520" opacity=".9" />
                      {(isCurrent || isHovered) && <circle r={r + 15} fill="#aeefd8" opacity=".17" />}
                      <circle r={r} fill={isCurrent ? "url(#world-node-cap)" : isLinked ? "#87dcc5" : "#7894a5"} stroke={isCurrent ? "#f7f4da" : "#d6e7e7"} strokeOpacity={isCurrent || isLinked ? 1 : .6} strokeWidth={isCurrent ? 4 : 1.6} />
                      {isCurrent && <circle r={r + 10} fill="none" stroke="#f9e9ae" strokeDasharray="3 6" strokeWidth={2.5} />}
                      {isHovered && !isCurrent && zoom > 1.4 && (
                        <text x={0} y={-r-16} textAnchor="middle" className="world-atlas-node-label">{node.nameJa}</text>
                      )}
                      <title>{node.nameJa}</title>
                      <circle r={Math.max(13, r)} fill="transparent" stroke="none" />
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
          <div className="world-atlas-map-bottom">
            <span>中心：よく知られている ／ 外側：あまり知られていない</span>
            <div className="world-atlas-legend" aria-label="点と線の凡例">
              <span><i className="is-normal" /> 収録職業</span>
              <span><i className="is-linked" /> 関連職業</span>
              <span><i className="is-selected" /> 現在地</span>
              <span><i className="is-route" /> 歩いた道</span>
            </div>
          </div>
          <div className="world-atlas-hover" aria-live="polite">
            {displayed ? <><span>{displayed.emoji}</span><strong>{displayed.nameJa}</strong><small>{displayed.summaryJa}</small></> : "点を選ぶと詳細が現れます"}
          </div>
          </>
          )}
        </div>
        <aside className="world-atlas-inspector" aria-live="polite">
          <div className="world-atlas-inspector-top">
            <span>SELECTED RECORD / 現在地</span>
            <span className="world-atlas-industry-tag">{labels.get(current?.industryId ?? "") ?? "業界未分類"} · {industryCounts.get(current?.industryId ?? "") ?? 0}職業</span>
            <div className="world-atlas-current-emoji" aria-hidden="true">{current?.emoji}</div>
            <h3>{current?.nameJa}</h3>
            <p>{current?.summaryJa}</p>
            {current && <Link href={`/jobs/${current.slug}`} className="world-atlas-read">この仕事を読む ↗</Link>}
            {nextSurprise && (
              <button
                type="button"
                className="world-atlas-discover"
                onClick={() => { select(nextSurprise.slug, true); setLens("network"); setZoom((value) => Math.max(value, 1.25)); }}
              >
                <span>DISCOVER / 次の一歩</span>
                <strong>意外な隣へ進む <span aria-hidden="true">↗</span></strong>
                <small>{nextSurprise.nameJa}とのつながりを見つける</small>
              </button>
            )}
          </div>
          <nav className="world-atlas-route" aria-label="仕事をたどった履歴">
            <div><span>YOUR JOURNEY / 探索の足あと</span><button type="button" disabled={route.length < 2} onClick={() => navigateBack(route.length - 2)}>← 前に戻る</button></div>
            <ol>{route.map((slug, index) => {
              const node = byS.get(slug)?.node;
              return node && <li key={`${slug}-${index}`}>
                <button type="button" aria-current={index === route.length - 1 ? "step" : undefined} onClick={() => navigateBack(index)}>{node.nameJa}</button>
              </li>;
            })}</ol>
          </nav>
          <div className="world-atlas-inspector-links">
            <span>CONNECTED / {edges.length}つのつながり</span>
            <p>共通する特徴を確かめて、次の仕事へ。上の図と番号が対応しています。</p>
            <ol>
              {edges.map(({ edge, target }, index) => target ? (
                <li key={edge.slug}>
                  <button
                    type="button"
                    onClick={() => select(target.node.slug, true)}
                    onMouseEnter={() => setHovered(target.node.slug)}
                    onMouseLeave={() => setHovered(null)}
                    onFocus={() => setHovered(target.node.slug)}
                    onBlur={() => setHovered(null)}
                  >
                    <span className="world-atlas-inspector-number">{String(index + 1).padStart(2, "0")}</span>
                    <span><strong>{target.node.emoji} {target.node.nameJa}</strong><small><i style={{ backgroundColor: facetColors[edge.dominantFacet] ?? "#a5efd1" }} /> {facetLabels[edge.dominantFacet] ?? "特徴"}：{edge.sharedLabelJa ?? edge.reasonJa}</small></span>
                    <span aria-hidden="true">↗</span>
                  </button>
                </li>
              ) : null)}
            </ol>
          </div>
        </aside>
      </div>
      <p className="world-atlas-disclaimer">この地図の位置とつながりは、図鑑の編集分類によるものです。従事者数の実測値・転職しやすさ・職業の優劣を表すものではありません。「関係を読む」は選択した仕事と直接つながる職業を示します。「全体地図」では全150職業の位置関係を俯瞰できます。</p>
    </div>
  );
}
