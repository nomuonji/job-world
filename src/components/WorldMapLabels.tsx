"use client";

import type { CSSProperties } from "react";
import type { WorldNodeView } from "@/lib/view";
import type { WorldPlacement } from "@/lib/world-map";

type Connection = {
  edge: { slug: string; dominantFacet: string; sharedLabelJa?: string | null; reasonJa: string };
  target: WorldPlacement;
};

type CardSlot = { x: number; y: number };
const WIDTH = 228;
const HEIGHT = 110;
const SLOTS: CardSlot[] = [
  { x: 17, y: 178 }, { x: 755, y: 178 },
  { x: 17, y: 432 }, { x: 755, y: 432 },
  { x: 17, y: 686 }, { x: 755, y: 686 },
];

/**
 * Assign the 6 directly linked occupations to stable, non-overlapping on-map
 * labels. A tiny optimal assignment keeps leader lines as short as possible.
 * The chart stays a true 150-node geographic view, not a detached card list.
 */
function assignSlots(connections: Connection[]) {
  const n = Math.min(6, connections.length);
  let states = new Map<number, { cost: number; slots: number[] }>();
  states.set(0, { cost: 0, slots: [] });
  for (let i = 0; i < n; i++) {
    const next = new Map<number, { cost: number; slots: number[] }>();
    for (const [mask, state] of states) {
      for (let slot = 0; slot < SLOTS.length; slot++) {
        if (mask & (1 << slot)) continue;
        const { x, y } = SLOTS[slot];
        const endX = x < 500 ? x + WIDTH : x;
        const endY = y + HEIGHT / 2;
        const node = connections[i].target;
        const dx = node.x - endX;
        const dy = node.y - endY;
        // Reserve the exact destination node for the dot/number, not a card.
        const obstruction = Math.abs(node.x - (x + WIDTH / 2)) < WIDTH / 2 + 17 &&
          Math.abs(node.y - endY) < HEIGHT / 2 + 17 ? 140000 : 0;
        const cost = state.cost + dx * dx + dy * dy + obstruction;
        const nextMask = mask | (1 << slot);
        const current = next.get(nextMask);
        if (!current || cost < current.cost) next.set(nextMask, { cost, slots: [...state.slots, slot] });
      }
    }
    states = next;
  }
  const solution = [...states.values()].reduce((a, b) => a.cost < b.cost ? a : b);
  return connections.slice(0, n).map((connection, i) => ({
    ...connection,
    ...SLOTS[solution.slots[i]],
    ordinal: i + 1,
  }));
}

export function WorldMapLabels({
  selected,
  focus,
  connections,
  facetColors,
  facetLabels,
  onSelect,
  onHover,
  hovered,
}: {
  selected: WorldNodeView;
  focus: WorldPlacement;
  connections: Connection[];
  facetColors: Record<string, string>;
  facetLabels: Record<string, string>;
  onSelect: (slug: string) => void;
  onHover: (slug: string | null) => void;
  hovered: string | null;
}) {
  const placed = assignSlots(connections);
  const selectedCardX = 305;
  const selectedCardY = 27;
  return (
    <g className="world-map-labels" aria-label="職業とそのつながりの説明">
      <path
        d={`M ${focus.x} ${focus.y} L ${selectedCardX + 190} ${selectedCardY + 96}`}
        fill="none" stroke="#f4dca4" strokeWidth={2} strokeDasharray="5 7"
        opacity=".78" pointerEvents="none"
      />
      <foreignObject x={selectedCardX} y={selectedCardY} width={380} height={100}>
        <div className="world-map-current-label">
          <span className="world-map-current-kicker">● 現在地 / SELECTED</span>
          <strong>{selected.emoji} {selected.nameJa}</strong>
          <small>光る点が、この仕事の地図上の位置です。</small>
        </div>
      </foreignObject>
      {placed.map(({ edge, target, x, y, ordinal }) => {
        const color = facetColors[edge.dominantFacet] ?? "#8bdbc5";
        const description = edge.sharedLabelJa ?? edge.reasonJa;
        const reason = facetLabels[edge.dominantFacet] ?? "共通点";
        const connectorX = x < 500 ? x + WIDTH : x;
        const connectorY = y + HEIGHT / 2;
        const active = hovered === target.node.slug;
        return (
          <g key={edge.slug} className={`world-map-label-connection${active ? " is-active" : ""}`}>
            <path
              d={`M ${target.x} ${target.y} L ${connectorX} ${connectorY}`}
              stroke={color}
              strokeWidth={active ? 3.5 : 1.6}
              strokeDasharray="4 7"
              opacity={active ? 1 : .65}
              fill="none"
              pointerEvents="none"
            />
            <circle cx={target.x} cy={target.y} r={20} fill="#102e42" stroke={color} strokeWidth={3} pointerEvents="none"/>
            <text x={target.x} y={target.y + 5.5} fontSize={17} fontWeight={900} fill="#f8faf0" textAnchor="middle" pointerEvents="none">{ordinal}</text>
            <foreignObject x={x} y={y} width={WIDTH} height={HEIGHT}>
              <div className="world-map-label-foreign">
                <button
                  type="button"
                  className="world-map-label-card"
                  style={{"--label-accent": color} as CSSProperties}
                  onClick={() => onSelect(target.node.slug)}
                  onMouseEnter={() => onHover(target.node.slug)}
                  onMouseLeave={() => onHover(null)}
                  onFocus={() => onHover(target.node.slug)}
                  onBlur={() => onHover(null)}
                  aria-label={`${target.node.nameJa}。共通点は${reason}：${description}。この仕事へ移動する`}
                >
                  <span className="world-map-label-number">0{ordinal} <span aria-hidden="true">↗</span></span>
                  <strong>{target.node.emoji} {target.node.nameJa}</strong>
                  <small>{reason}：{description}</small>
                </button>
              </div>
            </foreignObject>
          </g>
        );
      })}
    </g>
  );
}
