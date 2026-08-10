import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type {
  DerivedNeighbor,
  Facet,
  FacetId,
  GeneratedTaxonomy,
  GraphHealth,
  Job,
  JobFile,
  JobStub,
  NeighborEntry,
  Tag,
  TagFile,
  TaxonomyTag,
} from "../src/types";
import {
  EDGE_KIND_LABEL,
  EDGE_KIND_REVERSE_LABEL,
  TUNING,
  allNorms,
  buildContext,
  buildReason,
  deriveNeighbors,
  invertedIndex,
  similarity,
  surpriseFactor,
} from "../src/lib/graph";
import {
  GENERATED_DIR,
  JOBS_DIR,
  TAGS_DIR,
  loadSourceData,
} from "./load";

/**
 * 手書きソースから派生物を作る。
 *
 * 生成物はコミットする。理由:
 *  - タグを1つ足したとき隣人がどう変わったかが git diff で見える。
 *    キュレーション品質の管理手段としてこれが一番価値がある。
 *  - next build がスクリプト実行に依存しない（CIが単純）。
 *  - 生成物が古いことは CI の `git diff --exit-code` で機械的に検出できる。
 *
 * ソースJSONの整形書き戻しも兼ねる（手書き差分のノイズを消すため）。
 */

const ENTRY_FAMILIARITY = 4;
const RARE_THRESHOLD = 4;
const HOPS_TO_RARE = 3;
/** 各隣人について保存する2ホップ先スタブの数。 */
const STUB_SIZE = 8;

// ---------------------------------------------------------------------------
// 1. 読み込み
// ---------------------------------------------------------------------------

const { facets, tags, jobs, jobFiles, tagFiles } = loadSourceData();

const tagList: Tag[] = tags.map((t) => t.tag);
const jobList: Job[] = jobs.map((j) => j.job);

// ---------------------------------------------------------------------------
// 2. ソースJSONをキー順固定で整形して書き戻す（フォーマッタ兼務）
// ---------------------------------------------------------------------------

const JOB_KEY_ORDER: (keyof Job)[] = [
  "slug",
  "nameJa",
  "nameEn",
  "aliasesJa",
  "kanaJa",
  "emoji",
  "summaryJa",
  "descriptionJa",
  "surpriseJa",
  "aDayJa",
  "howToBecomeJa",
  "tags",
  "rarity",
  "familiarity",
  "lifecycle",
  "edges",
  "sources",
  "updatedAt",
];

const TAG_KEY_ORDER: (keyof Tag)[] = [
  "id",
  "facet",
  "slug",
  "labelJa",
  "aliasesJa",
  "criteriaJa",
  "parentId",
  "status",
  "replacedBy",
];

function orderKeys<T extends object>(obj: T, order: (keyof T)[]): T {
  const out = {} as T;
  for (const key of order) {
    if (obj[key] !== undefined) out[key] = obj[key];
  }
  // 規約に無いキーも落とさず末尾に残す（型を増やしたときに黙って消えないように）。
  for (const key of Object.keys(obj) as (keyof T)[]) {
    if (!(key in out) && obj[key] !== undefined) out[key] = obj[key];
  }
  return out;
}

/** 2スペース + 末尾改行 + LF固定。CIのドリフト検出が改行コードで落ちないようにする。 */
function writeJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`.replace(/\r\n/g, "\n"), "utf8");
}

for (const [name, file] of jobFiles) {
  const formatted: JobFile = {
    industry: file.industry,
    // slug順に並べる。手で追記した位置に依存せず diff が安定する。
    jobs: [...file.jobs]
      .sort((a, b) => a.slug.localeCompare(b.slug))
      .map((j) => orderKeys(j, JOB_KEY_ORDER)),
  };
  writeJson(join(JOBS_DIR, name), formatted);
}

for (const [name, file] of tagFiles) {
  const formatted: TagFile = {
    facet: file.facet,
    tags: file.tags.map((t) => orderKeys(t, TAG_KEY_ORDER)),
  };
  writeJson(join(TAGS_DIR, name), formatted);
}

// ---------------------------------------------------------------------------
// 3. 隣人の導出
// ---------------------------------------------------------------------------

const ctx = buildContext(jobList, tagList, facets);
const inverted = invertedIndex(ctx);
const norms = allNorms(ctx);

const neighborsBySlug = new Map<string, DerivedNeighbor[]>();
for (const job of jobList) {
  neighborsBySlug.set(job.slug, deriveNeighbors(ctx, inverted, norms, job));
}

// --- 手書きの型付きエッジを重ねる -------------------------------------------
// 自動導出では絶対に出ない関係（「表と裏」「似て非なる」など）だけを少数手書きする。
// 双方向に張り、スコアを下限まで引き上げて必ず表示させる。

function upsertTyped(
  fromSlug: string,
  toSlug: string,
  kind: DerivedNeighbor["typed"] extends infer T
    ? T extends { kind: infer K }
      ? K
      : never
    : never,
  noteJa: string,
  direction: "out" | "in",
): void {
  const from = ctx.jobBySlug.get(fromSlug);
  const to = ctx.jobBySlug.get(toSlug);
  if (!from || !to) return;

  const list = neighborsBySlug.get(fromSlug);
  if (!list) return;

  const existing = list.find((n) => n.slug === toSlug);
  if (existing) {
    existing.score = Math.max(existing.score, TUNING.typedEdgeFloor);
    existing.typed = { kind, noteJa, direction };
    return;
  }

  // タグ上は繋がっていない相手。だからこそ手書きする価値がある。
  const { sim, sharedTags, byFacet } = similarity(
    ctx,
    fromSlug,
    toSlug,
    norms.get(fromSlug) ?? 1,
    norms.get(toSlug) ?? 1,
  );
  list.push({
    slug: toSlug,
    score: Math.max(sim * surpriseFactor(ctx, from, to, sharedTags), TUNING.typedEdgeFloor),
    sharedTags: sharedTags.slice(0, 4),
    dominantFacet: sharedTags[0]?.facet ?? "industry",
    reasonJa: noteJa,
    byFacet,
    typed: { kind, noteJa, direction },
  });
}

for (const job of jobList) {
  for (const edge of job.edges ?? []) {
    upsertTyped(job.slug, edge.to, edge.kind, edge.noteJa, "out");
    upsertTyped(edge.to, job.slug, edge.kind, edge.noteJa, "in");
  }
}

// --- 相互性の保証 -----------------------------------------------------------
// a の上位(core)に b が居るなら、b のプールにも a を必ず含める。
// これがないと「入ったら戻れない」ノードが生まれ、探索が行き止まりになる。

for (const job of jobList) {
  const core = (neighborsBySlug.get(job.slug) ?? []).slice(0, TUNING.coreSize);
  for (const neighbor of core) {
    const reverse = neighborsBySlug.get(neighbor.slug);
    if (!reverse || reverse.some((n) => n.slug === job.slug)) continue;

    const other = ctx.jobBySlug.get(neighbor.slug);
    if (!other) continue;
    const { sim, sharedTags, byFacet } = similarity(
      ctx,
      neighbor.slug,
      job.slug,
      norms.get(neighbor.slug) ?? 1,
      norms.get(job.slug) ?? 1,
    );
    reverse.push({
      slug: job.slug,
      score: sim * surpriseFactor(ctx, other, job, sharedTags),
      sharedTags: sharedTags.slice(0, 4),
      dominantFacet: sharedTags[0]?.facet ?? "industry",
      reasonJa: buildReason(ctx, other, job, sharedTags),
      byFacet,
    });
  }
}

// 最終的な並べ替えとプールサイズの確定
for (const [slug, list] of neighborsBySlug) {
  list.sort((a, b) => b.score - a.score);
  neighborsBySlug.set(slug, list.slice(0, TUNING.poolSize));
}

// ---------------------------------------------------------------------------
// 4. 2ホップ先の軽量スタブ（図の楽観遷移用）
// ---------------------------------------------------------------------------

function stubOf(slug: string): JobStub | null {
  const job = ctx.jobBySlug.get(slug);
  if (!job) return null;
  return { slug: job.slug, nameJa: job.nameJa, emoji: job.emoji };
}

const neighborEntries: NeighborEntry[] = jobList.map((job) => {
  const neighbors = neighborsBySlug.get(job.slug) ?? [];
  const stubs: Record<string, JobStub[]> = {};
  for (const neighbor of neighbors.slice(0, TUNING.coreSize)) {
    const second = (neighborsBySlug.get(neighbor.slug) ?? [])
      .slice(0, STUB_SIZE)
      .map((n) => stubOf(n.slug))
      .filter((s): s is JobStub => s !== null);
    stubs[neighbor.slug] = second;
  }
  return { slug: job.slug, neighbors, stubs };
});

// ---------------------------------------------------------------------------
// 5. グラフ健全性の測定（受け入れ基準の実測値の出どころ）
// ---------------------------------------------------------------------------

/** 上位core件を無向化した隣接。到達性と孤立の判定はこのグラフで行う。 */
const adjacency = new Map<string, Set<string>>();
for (const job of jobList) adjacency.set(job.slug, new Set());
for (const job of jobList) {
  for (const neighbor of (neighborsBySlug.get(job.slug) ?? []).slice(
    0,
    TUNING.coreSize,
  )) {
    adjacency.get(job.slug)?.add(neighbor.slug);
    adjacency.get(neighbor.slug)?.add(job.slug);
  }
}

const inDegree = new Map<string, number>(jobList.map((j) => [j.slug, 0]));
for (const job of jobList) {
  for (const neighbor of (neighborsBySlug.get(job.slug) ?? []).slice(
    0,
    TUNING.coreSize,
  )) {
    inDegree.set(neighbor.slug, (inDegree.get(neighbor.slug) ?? 0) + 1);
  }
}

const orphanSlugs = jobList
  .filter((j) => (inDegree.get(j.slug) ?? 0) === 0)
  .map((j) => j.slug);

const entrySlugs = jobList
  .filter((j) => j.familiarity >= ENTRY_FAMILIARITY)
  .map((j) => j.slug);

function bfs(starts: string[]): Map<string, number> {
  const dist = new Map<string, number>();
  const queue: string[] = [];
  for (const s of starts) {
    if (!dist.has(s)) {
      dist.set(s, 0);
      queue.push(s);
    }
  }
  for (let head = 0; head < queue.length; head++) {
    const current = queue[head];
    const d = dist.get(current) ?? 0;
    for (const next of adjacency.get(current) ?? []) {
      if (dist.has(next)) continue;
      dist.set(next, d + 1);
      queue.push(next);
    }
  }
  return dist;
}

const reachable = bfs(entrySlugs);
const unreachableSlugs = jobList
  .filter((j) => !reachable.has(j.slug))
  .map((j) => j.slug);

const hopsToRare: number[] = [];
const entriesWithoutRareWithin3: string[] = [];
for (const entry of entrySlugs) {
  const dist = bfs([entry]);
  let best = Infinity;
  for (const job of jobList) {
    if (job.rarity < RARE_THRESHOLD) continue;
    const d = dist.get(job.slug);
    if (d !== undefined && d > 0 && d < best) best = d;
  }
  if (best === Infinity) {
    entriesWithoutRareWithin3.push(entry);
  } else {
    hopsToRare.push(best);
    if (best > HOPS_TO_RARE) entriesWithoutRareWithin3.push(entry);
  }
}

const totalDegree = [...adjacency.values()].reduce((a, s) => a + s.size, 0);

const health: GraphHealth = {
  jobCount: jobList.length,
  tagCount: tagList.length,
  averageDegree: jobList.length
    ? Number((totalDegree / jobList.length).toFixed(2))
    : 0,
  orphanSlugs,
  entrySlugs,
  reachabilityRatio: jobList.length
    ? Number(((jobList.length - unreachableSlugs.length) / jobList.length).toFixed(4))
    : 0,
  unreachableSlugs,
  averageHopsToRare: hopsToRare.length
    ? Number((hopsToRare.reduce((a, b) => a + b, 0) / hopsToRare.length).toFixed(2))
    : 0,
  entriesWithoutRareWithin3,
};

// ---------------------------------------------------------------------------
// 6. 生成物の書き出し
// ---------------------------------------------------------------------------

mkdirSync(GENERATED_DIR, { recursive: true });

// jobs-manifest.ts — ファイル追加時に lib/data.ts を手で編集しなくて済むようにする。
const jobFileNames = [...jobFiles.keys()].sort();
const manifest = `// このファイルは scripts/build-data.ts が生成します。手で編集しないでください。
import type { JobFile } from "@/types";
${jobFileNames
  .map(
    (name, i) =>
      `import file${i} from "../jobs/${name}";`,
  )
  .join("\n")}

export const JOB_FILES = [
${jobFileNames.map((_, i) => `  file${i} as unknown as JobFile,`).join("\n")}
];
`;
writeFileSync(join(GENERATED_DIR, "jobs-manifest.ts"), manifest.replace(/\r\n/g, "\n"), "utf8");

const taxonomyTags: TaxonomyTag[] = tagList.map((tag) => ({
  ...tag,
  df: ctx.df.get(tag.id) ?? 0,
}));

const taxonomy: GeneratedTaxonomy = {
  facets: facets as Facet[],
  tags: taxonomyTags,
  jobCount: jobList.length,
};
writeJson(join(GENERATED_DIR, "taxonomy.json"), taxonomy);

// tagId -> そのタグを持つ職業slug（祖先展開後ではなく直接付いたものだけ）
const tagIndex: Record<string, string[]> = {};
for (const job of jobList) {
  for (const tagId of job.tags) {
    (tagIndex[tagId] ??= []).push(job.slug);
  }
}
for (const key of Object.keys(tagIndex)) tagIndex[key].sort();
writeJson(join(GENERATED_DIR, "tag-index.json"), tagIndex);

writeJson(join(GENERATED_DIR, "neighbors.json"), neighborEntries);
writeJson(join(GENERATED_DIR, "graph-health.json"), health);

const byFacetCount: Record<string, number> = {};
for (const facet of facets) {
  byFacetCount[facet.id] = taxonomyTags.filter(
    (t) => t.facet === facet.id,
  ).length;
}
writeJson(join(GENERATED_DIR, "stats.json"), {
  jobCount: jobList.length,
  tagCount: tagList.length,
  tagsByFacet: byFacetCount,
  rarityDistribution: [1, 2, 3, 4, 5].map(
    (r) => jobList.filter((j) => j.rarity === r).length,
  ),
  familiarityDistribution: [1, 2, 3, 4, 5].map(
    (f) => jobList.filter((j) => j.familiarity === f).length,
  ),
  lifecycleCounts: Object.fromEntries(
    ["traditional", "established", "emerging", "declining"].map((l) => [
      l,
      jobList.filter((j) => j.lifecycle === l).length,
    ]),
  ),
  typedEdgeCount: jobList.reduce((a, j) => a + (j.edges?.length ?? 0), 0),
  generatedAt: new Date().toISOString().slice(0, 10),
});

// ---------------------------------------------------------------------------
// 7. コンソール出力（チューニング時に隣人を目で見るため）
// ---------------------------------------------------------------------------

console.log(
  `職業 ${health.jobCount} 件 / タグ ${health.tagCount} 件 を処理しました。`,
);
console.log(
  `平均次数 ${health.averageDegree} / 到達率 ${(health.reachabilityRatio * 100).toFixed(1)}% / 孤立 ${health.orphanSlugs.length} 件 / 入口→珍しい仕事 平均 ${health.averageHopsToRare} ホップ`,
);

if (process.argv.includes("--show")) {
  const facetLabel = new Map(facets.map((f) => [f.id as FacetId, f.labelJa]));
  for (const entry of neighborEntries) {
    const job = ctx.jobBySlug.get(entry.slug);
    console.log(`\n${job?.emoji} ${job?.nameJa} (${entry.slug})`);
    for (const n of entry.neighbors.slice(0, 6)) {
      const other = ctx.jobBySlug.get(n.slug);
      const kind = n.typed
        ? ` [${n.typed.direction === "out" ? EDGE_KIND_LABEL[n.typed.kind] : EDGE_KIND_REVERSE_LABEL[n.typed.kind]}]`
        : "";
      console.log(
        `  ${n.score.toFixed(3)} ${other?.emoji} ${other?.nameJa}  <${facetLabel.get(n.dominantFacet)}>${kind}`,
      );
      console.log(`         ${n.reasonJa}`);
    }
  }
}
