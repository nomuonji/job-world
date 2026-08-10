import type { Facet, FacetId } from "@/types";

/** 配置に必要な最小限の形。導出隣人でも表示用ノードでも受けられるようにしておく。 */
export interface Placeable {
  slug: string;
  score: number;
  dominantFacet: FacetId;
}

/**
 * エゴネットワークの配置計算。
 *
 * 物理シミュレーション（d3-force等）は使わない。理由:
 *  1. 力学が解くのは「任意グラフの重なりと交差の最小化」だが、
 *     中心1＋周囲N という構造は確定しているのでその問題が存在しない。
 *  2. 周囲ノード同士のエッジを描かない（描くと毛玉になる＝明確な非目標）ため、
 *     線は常に中心からの放射N本だけで、交差は原理的に起きない。
 *  3. 決定論的なほうが体験として優れている。同じ職業を再訪すると同じ絵になるので
 *     「場所の記憶」ができ、それが「自分の地図が広がっている」感覚の土台になる。
 *     力学は毎回違う絵になり、この感覚を壊す。
 *  4. 依存ゼロを保てる。
 *
 * 角度はファセットでセクター分けする。同じ軸で繋がった隣人が同じ方向に集まるので、
 * 「なぜ繋がっているか」をレイアウト自体が説明することになる。
 * セクターの開始角は Facet.order から決まるので、どの職業でも軸の方向は同じ。
 */

export const VIEW = {
  size: 800,
  cx: 400,
  cy: 400,
  innerRadius: 210,
  outerRadius: 320,
  /** 中心ノードの半径。 */
  centerNodeRadius: 46,
  nodeRadius: 30,
} as const;

export interface LayoutNode<T extends Placeable = Placeable> {
  neighbor: T;
  x: number;
  y: number;
  /** ラベルを中心の左右どちら側に出すか。 */
  anchor: "start" | "middle" | "end";
  ring: "inner" | "outer";
}

export interface FacetSector {
  facet: FacetId;
  /** 度。ラベルを置くための角度。 */
  midAngle: number;
  labelX: number;
  labelY: number;
  count: number;
}

export interface EgoLayout<T extends Placeable = Placeable> {
  nodes: LayoutNode<T>[];
  sectors: FacetSector[];
}

const toRad = (deg: number) => (deg * Math.PI) / 180;

/**
 * 隣人を配置する。
 * @param neighbors 表示する隣人（スコア降順）
 * @param facets 軸の定義（order でセクター方向が決まる）
 * @param innerCount 内リングに置く件数
 */
export function layoutEgoNetwork<T extends Placeable>(
  neighbors: T[],
  facets: Facet[],
  innerCount: number,
): EgoLayout<T> {
  if (neighbors.length === 0) return { nodes: [], sectors: [] };

  const orderOf = new Map(facets.map((f) => [f.id, f.order]));

  // 軸ごとにまとめ、軸は order 順に並べる。
  const groups = new Map<FacetId, T[]>();
  for (const n of neighbors) {
    const list = groups.get(n.dominantFacet) ?? [];
    list.push(n);
    groups.set(n.dominantFacet, list);
  }
  const orderedGroups = [...groups.entries()].sort(
    (a, b) => (orderOf.get(a[0]) ?? 99) - (orderOf.get(b[0]) ?? 99),
  );

  const total = neighbors.length;
  const maxScore = Math.max(...neighbors.map((n) => n.score), 0.0001);
  const minScore = Math.min(...neighbors.map((n) => n.score));
  const range = maxScore - minScore || 1;

  // 内リングに入る対象をスコア上位から決める。
  const innerSet = new Set(
    [...neighbors]
      .sort((a, b) => b.score - a.score)
      .slice(0, innerCount)
      .map((n) => n.slug),
  );

  const nodes: LayoutNode<T>[] = [];
  const sectors: FacetSector[] = [];

  // 真上(-90°)から時計回りに、件数に比例した扇形を割り当てる。
  let cursor = -90;
  for (const [facet, members] of orderedGroups) {
    const span = (members.length / total) * 360;
    const sectorStart = cursor;
    const sectorEnd = cursor + span;

    members.sort((a, b) => b.score - a.score);
    members.forEach((neighbor, index) => {
      // 扇の中で等間隔。端に寄りすぎないよう (index+0.5)/n を使う。
      const angle = sectorStart + (span * (index + 0.5)) / members.length;
      const ring = innerSet.has(neighbor.slug) ? "inner" : "outer";
      const base = ring === "inner" ? VIEW.innerRadius : VIEW.outerRadius;

      // スコアが高いほど中心に近い。距離が関連の強さを表す。
      const normalized = (neighbor.score - minScore) / range;
      const r = base * (1.18 - 0.18 * normalized);

      const x = VIEW.cx + r * Math.cos(toRad(angle));
      const y = VIEW.cy + r * Math.sin(toRad(angle));

      const cos = Math.cos(toRad(angle));
      const anchor: LayoutNode<T>["anchor"] =
        Math.abs(cos) < 0.35 ? "middle" : cos > 0 ? "start" : "end";

      nodes.push({ neighbor, x, y, anchor, ring });
    });

    const midAngle = (sectorStart + sectorEnd) / 2;
    const labelRadius = VIEW.outerRadius + 62;
    sectors.push({
      facet,
      midAngle,
      labelX: VIEW.cx + labelRadius * Math.cos(toRad(midAngle)),
      labelY: VIEW.cy + labelRadius * Math.sin(toRad(midAngle)),
      count: members.length,
    });

    cursor = sectorEnd;
  }

  return { nodes, sectors };
}

/** ラベルが長いと図が破綻するので切り詰める。全文は title 属性で出す。 */
export function truncate(text: string, max = 8): string {
  const chars = Array.from(text);
  return chars.length <= max ? text : `${chars.slice(0, max).join("")}…`;
}
