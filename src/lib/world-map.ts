import type { WorldNodeView } from "@/lib/view";

/**
 * 全体マップの配置計算。
 *
 * 「全職業を一枚に描くと毛玉になる」ため当初は非目標にしていたが、
 * 毛玉の正体は **常時描かれる大量のエッジ** であって、ノードの数ではない。
 * この地図はフォーカス中の職業の線しか引かないので、線は常に8本以下に収まる。
 *
 * 配置には意味を持たせる:
 *   角度 = 業界（同じ業界が同じ方向に集まり、region ラベルで読める）
 *   半径 = 既知度（中心が「誰でも知っている」、外周が「名前も知らない」）
 *
 * 中心から外へ向かうことが、そのまま既知から未知への移動になる。
 * ページ遷移を伴わないので、地図の形は最後まで変わらない。
 */

export const WORLD = {
  size: 1000,
  cx: 500,
  cy: 500,
  /** 既知度5（誰でも知っている）が置かれる半径。 */
  innerRadius: 150,
  /** 既知度1（業界の外では通じない）が置かれる半径。 */
  outerRadius: 400,
  /** 業界名を置く半径。 */
  regionLabelRadius: 452,
  nodeRadius: 15,
  focusNodeRadius: 25,
  /**
   * 同じ業界で既知度も同じ職業は、そのままだと同じ半径・近い角度に並んで重なる。
   * 半径を少しずらして逃がす。角度ではなく半径をずらすのは、
   * 「外へ行くほど知られていない」という読み方を壊さない範囲に収まるため。
   */
  sameBandSpread: 34,
} as const;

export interface WorldPlacement {
  node: WorldNodeView;
  x: number;
  y: number;
  /** ラベルを左右どちらに出すか。 */
  anchor: "start" | "end";
}

export interface WorldRegion {
  industryId: string;
  labelJa: string;
  labelX: number;
  labelY: number;
  midAngle: number;
  count: number;
}

export interface WorldLayout {
  placements: WorldPlacement[];
  regions: WorldRegion[];
  byS: Map<string, WorldPlacement>;
}

const toRad = (deg: number) => (deg * Math.PI) / 180;

/** 扇の端に寄りすぎないよう、割り当て角の少し内側だけを使う。 */
const SECTOR_FILL = 0.84;

/** これ以上近づいたら重なりとみなす距離（ノード半径15の2倍＋余白）。 */
const MIN_DISTANCE = 34;
/** 緩和の反復回数。決定論的に回すので、何度描いても同じ地図になる。 */
const RELAX_PASSES = 24;

export function layoutWorldMap(
  nodes: WorldNodeView[],
  industryOrder: string[],
  industryLabels: Map<string, string>,
): WorldLayout {
  const groups = new Map<string, WorldNodeView[]>();
  for (const node of nodes) {
    const list = groups.get(node.industryId) ?? [];
    list.push(node);
    groups.set(node.industryId, list);
  }

  const orderIndex = new Map(industryOrder.map((id, i) => [id, i]));
  const ordered = [...groups.entries()].sort(
    (a, b) => (orderIndex.get(a[0]) ?? 99) - (orderIndex.get(b[0]) ?? 99),
  );

  const total = nodes.length || 1;
  const regions: WorldRegion[] = [];
  // 先に極座標で置いてから、重なりだけを半径方向に逃がす。
  const polar: { node: WorldNodeView; angle: number; r: number }[] = [];

  // 真上(-90°)から時計回りに、件数に比例した扇形を業界へ割り当てる。
  let cursor = -90;

  for (const [industryId, members] of ordered) {
    const span = (members.length / total) * 360;
    const start = cursor;

    // 既知度の高い順に並べると、扇が中心から外へ伸びる腕のように見える。
    const sorted = [...members].sort(
      (a, b) =>
        b.familiarity - a.familiarity || a.slug.localeCompare(b.slug),
    );

    const used = span * SECTOR_FILL;
    const pad = (span - used) / 2;

    // 同じ既知度の職業が何番目かを数えておく（半径をずらして重なりを避けるため）。
    const bandSize = new Map<number, number>();
    for (const node of sorted) {
      bandSize.set(node.familiarity, (bandSize.get(node.familiarity) ?? 0) + 1);
    }
    const bandSeen = new Map<number, number>();

    sorted.forEach((node, i) => {
      const angle =
        sorted.length === 1
          ? start + span / 2
          : start + pad + (used * i) / (sorted.length - 1);

      const t = (5 - node.familiarity) / 4; // 0 = 誰でも知っている
      const base =
        WORLD.innerRadius + t * (WORLD.outerRadius - WORLD.innerRadius);

      const size = bandSize.get(node.familiarity) ?? 1;
      const k = bandSeen.get(node.familiarity) ?? 0;
      bandSeen.set(node.familiarity, k + 1);
      const r =
        base + (k - (size - 1) / 2) * (size > 1 ? WORLD.sameBandSpread : 0);

      polar.push({ node, angle, r });
    });

    const midAngle = start + span / 2;
    regions.push({
      industryId,
      labelJa: industryLabels.get(industryId) ?? industryId,
      midAngle,
      labelX: WORLD.cx + WORLD.regionLabelRadius * Math.cos(toRad(midAngle)),
      labelY: WORLD.cy + WORLD.regionLabelRadius * Math.sin(toRad(midAngle)),
      count: members.length,
    });

    cursor = start + span;
  }

  /*
   * 重なりの解消。
   * 角度は業界を表しているので動かさず、半径だけを押し広げる。
   * 走査順が固定なので結果は決定論的（何度描いても同じ地図になる）。
   */
  const minR = WORLD.innerRadius - 70;
  const maxR = WORLD.outerRadius + 60;
  const pos = (p: { angle: number; r: number }) => ({
    x: WORLD.cx + p.r * Math.cos(toRad(p.angle)),
    y: WORLD.cy + p.r * Math.sin(toRad(p.angle)),
  });

  for (let pass = 0; pass < RELAX_PASSES; pass++) {
    let moved = false;
    for (let i = 0; i < polar.length; i++) {
      for (let j = i + 1; j < polar.length; j++) {
        const a = pos(polar[i]);
        const b = pos(polar[j]);
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d >= MIN_DISTANCE) continue;

        // 外側にいるほうをさらに外へ、内側にいるほうを内へ寄せる。
        const push = (MIN_DISTANCE - d) / 2 + 0.5;
        const [outer, inner] =
          polar[i].r >= polar[j].r ? [polar[i], polar[j]] : [polar[j], polar[i]];
        outer.r = Math.min(maxR, outer.r + push);
        inner.r = Math.max(minR, inner.r - push);
        moved = true;
      }
    }
    if (!moved) break;
  }

  const placements: WorldPlacement[] = [];
  const byS = new Map<string, WorldPlacement>();
  for (const p of polar) {
    const { x, y } = pos(p);
    const placement: WorldPlacement = {
      node: p.node,
      x,
      y,
      anchor: Math.cos(toRad(p.angle)) >= 0 ? "start" : "end",
    };
    placements.push(placement);
    byS.set(p.node.slug, placement);
  }

  return { placements, regions, byS };
}
