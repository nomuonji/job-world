import type {
  Facet,
  FacetId,
  GeneratedTaxonomy,
  GraphHealth,
  Job,
  NeighborEntry,
  TaxonomyTag,
} from "@/types";
import { JOB_FILES } from "@/data/generated/jobs-manifest";
import taxonomyJson from "@/data/generated/taxonomy.json";
import neighborsJson from "@/data/generated/neighbors.json";
import tagIndexJson from "@/data/generated/tag-index.json";
import healthJson from "@/data/generated/graph-health.json";

/**
 * サーバー/ビルド時のデータアクセス。
 * 静的importなので、参照した分だけビルドに焼き込まれる。
 *
 * クライアントコンポーネントからは絶対にこれを読まないこと。
 * 全職業のタグ配列がクライアントバンドルに載ってしまう。軽量版は data-client.ts。
 */

const taxonomy = taxonomyJson as unknown as GeneratedTaxonomy;
const neighborEntries = neighborsJson as unknown as NeighborEntry[];
const tagIndex = tagIndexJson as unknown as Record<string, string[]>;

let _allJobs: Job[] | null = null;

/** 全職業。slug でユニーク化し、読み順にソートする。 */
export function getAllJobs(): Job[] {
  if (_allJobs) return _allJobs;
  const bySlug = new Map<string, Job>();
  for (const file of JOB_FILES) {
    for (const job of file.jobs) bySlug.set(job.slug, job);
  }
  _allJobs = [...bySlug.values()].sort((a, b) =>
    a.kanaJa.localeCompare(b.kanaJa, "ja"),
  );
  return _allJobs;
}

const jobBySlug = () => new Map(getAllJobs().map((j) => [j.slug, j]));
let _jobMap: Map<string, Job> | null = null;

export function getJobBySlug(slug: string): Job | undefined {
  _jobMap ??= jobBySlug();
  return _jobMap.get(slug);
}

// --- タクソノミー -----------------------------------------------------------

export function getFacets(): Facet[] {
  return [...taxonomy.facets].sort((a, b) => a.order - b.order);
}

export function getFacet(id: string): Facet | undefined {
  return taxonomy.facets.find((f) => f.id === id);
}

export function getAllTags(): TaxonomyTag[] {
  return taxonomy.tags;
}

let _tagMap: Map<string, TaxonomyTag> | null = null;

export function getTag(id: string): TaxonomyTag | undefined {
  _tagMap ??= new Map(taxonomy.tags.map((t) => [t.id, t]));
  return _tagMap.get(id);
}

export function getTagsByFacet(facet: FacetId): TaxonomyTag[] {
  return taxonomy.tags
    .filter((t) => t.facet === facet)
    .sort((a, b) => b.df - a.df || a.labelJa.localeCompare(b.labelJa, "ja"));
}

/**
 * タクソノミーに定義された順のまま返す。
 * 全体マップの方角はこの順で決まるので、件数で並べ替えてはいけない
 * （データが増えるたびに地図が回ってしまい、「同じ場所を覚える」体験が壊れる）。
 */
export function getTagsInDefinitionOrder(facet: FacetId): TaxonomyTag[] {
  return taxonomy.tags.filter((t) => t.facet === facet);
}

/** 職業のタグを軸ごとにまとめる。詳細ページの「軸別タグ」表示に使う。 */
export function getJobTagsByFacet(
  job: Job,
): { facet: Facet; tags: TaxonomyTag[] }[] {
  return getFacets()
    .map((facet) => ({
      facet,
      tags: job.tags
        .map((id) => getTag(id))
        .filter((t): t is TaxonomyTag => !!t && t.facet === facet.id),
    }))
    .filter((group) => group.tags.length > 0);
}

export function getJobsWithTag(tagId: string): Job[] {
  return (tagIndex[tagId] ?? [])
    .map((slug) => getJobBySlug(slug))
    .filter((j): j is Job => !!j);
}

// --- 隣人 -------------------------------------------------------------------

let _neighborMap: Map<string, NeighborEntry> | null = null;

export function getNeighborEntry(slug: string): NeighborEntry | undefined {
  _neighborMap ??= new Map(neighborEntries.map((e) => [e.slug, e]));
  return _neighborMap.get(slug);
}

// --- 探索の入口 -------------------------------------------------------------

/**
 * 入口となる職業。既知度が高いものから選ぶ。
 * 「自分が知っている仕事」から辿り始められるようにするための集合。
 */
export function getEntryJobs(limit = 8): Job[] {
  return getAllJobs()
    .filter((j) => j.familiarity >= 4)
    .sort((a, b) => b.familiarity - a.familiarity || a.rarity - b.rarity)
    .slice(0, limit);
}

/** 到達してほしい珍しい職業。トップの「こんな仕事がある」枠に使う。 */
export function getRareJobs(limit = 6): Job[] {
  return getAllJobs()
    .filter((j) => j.rarity >= 4)
    .sort((a, b) => b.rarity - a.rarity || a.familiarity - b.familiarity)
    .slice(0, limit);
}

export function getGraphHealth(): GraphHealth {
  return healthJson as unknown as GraphHealth;
}
