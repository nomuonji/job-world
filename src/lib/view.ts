import type { FacetId, Job, NeighborEntry } from "@/types";
import { EDGE_KIND_LABEL, EDGE_KIND_REVERSE_LABEL } from "@/lib/graph";
import { getJobBySlug, getNeighborEntry, getTag } from "@/lib/data";

/**
 * クライアントへ渡す表示用のデータ。
 *
 * クライアントコンポーネントには Job をそのまま渡さない。
 * 全職業の本文やタグ配列がバンドルに載るのを避けるため、
 * 図と絞り込みに必要な最小限だけをここで抜き出す。
 */

export interface EgoNodeView {
  slug: string;
  nameJa: string;
  emoji: string;
  score: number;
  dominantFacet: FacetId;
  reasonJa: string;
  /** エッジ上に出す共有タグのラベル（業界タグ以外の最上位）。 */
  sharedLabelJa?: string;
  /** 軸ごとの寄与。軸で絞り込むときに使う。 */
  byFacet: Partial<Record<FacetId, number>>;
  /** 手書きエッジのときの関係名。 */
  typedLabelJa?: string;
}

export interface EgoCenterView {
  slug: string;
  nameJa: string;
  emoji: string;
}

export function toEgoNodes(entry: NeighborEntry | undefined): EgoNodeView[] {
  if (!entry) return [];
  const out: EgoNodeView[] = [];

  for (const neighbor of entry.neighbors) {
    const job = getJobBySlug(neighbor.slug);
    if (!job) continue;

    const shared = neighbor.sharedTags.find((t) => t.facet !== "industry");

    out.push({
      slug: job.slug,
      nameJa: job.nameJa,
      emoji: job.emoji,
      score: neighbor.score,
      dominantFacet: neighbor.dominantFacet,
      reasonJa: neighbor.reasonJa,
      sharedLabelJa: shared ? getTag(shared.id)?.labelJa : undefined,
      byFacet: neighbor.byFacet,
      typedLabelJa: neighbor.typed
        ? neighbor.typed.direction === "out"
          ? EDGE_KIND_LABEL[neighbor.typed.kind]
          : EDGE_KIND_REVERSE_LABEL[neighbor.typed.kind]
        : undefined,
    });
  }

  return out;
}

export function toEgoCenter(job: Job): EgoCenterView {
  return { slug: job.slug, nameJa: job.nameJa, emoji: job.emoji };
}

// ---------------------------------------------------------------------------
// 全体マップ用
// ---------------------------------------------------------------------------

export interface WorldEdgeView {
  slug: string;
  /** つながっている理由（フォーカス時にパネルへ出す）。 */
  reasonJa: string;
  /** 線の上に置く共有タグのラベル。 */
  sharedLabelJa?: string;
  dominantFacet: FacetId;
}

export interface WorldNodeView {
  slug: string;
  nameJa: string;
  emoji: string;
  summaryJa: string;
  industryId: string;
  familiarity: number;
  rarity: number;
  /** フォーカス時に線を引く相手。全職業分をクライアントへ送るので少数に絞る。 */
  edges: WorldEdgeView[];
}

/** 全体マップに描ける件数だけの隣人。多すぎると線が読めなくなる。 */
const WORLD_EDGE_COUNT = 6;

export function toWorldNodes(jobs: Job[]): WorldNodeView[] {
  return jobs.map((job) => {
    const industryTag = job.tags.find((t) => t.startsWith("industry."));
    const entry = getNeighborEntry(job.slug);

    const edges: WorldEdgeView[] = (entry?.neighbors ?? [])
      .slice(0, WORLD_EDGE_COUNT)
      .map((neighbor) => {
        const shared = neighbor.sharedTags.find((t) => t.facet !== "industry");
        return {
          slug: neighbor.slug,
          reasonJa: neighbor.reasonJa,
          sharedLabelJa: shared ? getTag(shared.id)?.labelJa : undefined,
          dominantFacet: neighbor.dominantFacet,
        };
      });

    return {
      slug: job.slug,
      nameJa: job.nameJa,
      emoji: job.emoji,
      summaryJa: job.summaryJa,
      industryId: industryTag ?? "industry.other",
      familiarity: job.familiarity,
      rarity: job.rarity,
      edges,
    };
  });
}
