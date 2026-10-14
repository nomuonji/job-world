"use client";

import type { CSSProperties } from "react";
import type { WorldNodeView } from "@/lib/view";

export type Relationship = {
  node: WorldNodeView;
  facetLabel: string;
  shared: string;
  color: string;
};

const POSITIONS = [
  { x: 26, y: 16 }, { x: 74, y: 16 },
  { x: 15, y: 50 }, { x: 85, y: 50 },
  { x: 26, y: 84 }, { x: 74, y: 84 },
];

export function RelationshipMap({
  current, related, hovered, onHover, onSelect, onOverview,
}: {
  current: WorldNodeView;
  related: Relationship[];
  hovered: string | null;
  onHover: (slug: string | null) => void;
  onSelect: (slug: string) => void;
  onOverview: () => void;
}) {
  return (
    <div className="relationship-map" aria-label={`${current.nameJa}と関連する仕事の関係図`}>
      <div className="relationship-map-lead">
        <strong>この仕事と、どこが似ている？</strong>
        <span>まわりの職業を選ぶと、中心の仕事が入れ替わります。</span>
      </div>
      <div className="relationship-map-orbit">
        <svg className="relationship-map-lines" viewBox="0 0 1000 720" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <radialGradient id="relationship-stage-glow"><stop offset="0" stopColor="#68a99b" stopOpacity=".22"/><stop offset="1" stopColor="#68a99b" stopOpacity="0"/></radialGradient>
          </defs>
          <circle cx="500" cy="360" r="300" fill="url(#relationship-stage-glow)" />
          <circle cx="500" cy="360" r="220" fill="none" stroke="#618b91" strokeOpacity=".16" strokeDasharray="4 11"/>
          {related.slice(0,6).map((item,i) => {
            const p = POSITIONS[i];
            return (
              <g key={item.node.slug}>
                <line x1={500} y1={360} x2={p.x*10} y2={p.y*7.2}
                  stroke={item.color}
                  strokeWidth={hovered === item.node.slug ? 5 : 2}
                  strokeOpacity={hovered === item.node.slug ? .95 : .43}
                />
                <circle cx={p.x*10} cy={p.y*7.2} r={5} fill={item.color}/>
              </g>
            );
          })}
        </svg>
        <div className="relationship-map-center">
          <span className="relationship-map-caption">今いる仕事 / START</span>
          <span className="relationship-map-center-emoji" aria-hidden="true">{current.emoji}</span>
          <h3>{current.nameJa}</h3>
          <span className="relationship-map-center-description">ここから6つの仕事へ</span>
        </div>
        {related.slice(0,6).map((item,i) => (
          <button
            key={item.node.slug}
            type="button"
            className={`relationship-map-job relationship-map-job-${i}${hovered === item.node.slug ? " is-hovered" : ""}`}
            style={{"--relationship-color":item.color} as CSSProperties}
            onClick={() => onSelect(item.node.slug)}
            onMouseEnter={() => onHover(item.node.slug)}
            onMouseLeave={() => onHover(null)}
            onFocus={() => onHover(item.node.slug)}
            onBlur={() => onHover(null)}
            aria-label={`${item.node.nameJa}に移動。共通点：${item.facetLabel}、${item.shared}`}
          >
            <span className="relationship-map-job-top"><b>{String(i+1).padStart(2,"0")}</b><span aria-hidden="true">{item.node.emoji}</span><span aria-hidden="true">↗</span></span>
            <strong>{item.node.nameJa}</strong>
            <small><i/>{item.facetLabel}：{item.shared}</small>
          </button>
        ))}
      </div>
      <div className="relationship-map-footer">
        <span>色と説明が、つながりの理由です。職業名を押すとそこから探索を続けられます。</span>
        <button type="button" onClick={onOverview}>全150職業の地図を表示 ↗</button>
      </div>
    </div>
  );
}
