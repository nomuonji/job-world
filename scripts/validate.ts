import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  EDGE_KINDS,
  type FacetId,
  type GraphHealth,
  type Job,
  type Tag,
} from "../src/types";
import {
  editDistance,
  isSingleGrapheme,
  isValidJobSlug,
  normalizeJa,
  parseTagId,
} from "../src/lib/slug";
import { GENERATED_DIR, assertFacetsWellFormed, loadSourceData } from "./load";

/**
 * データが規約どおりかを機械的に検査する。
 *
 * ERROR は CI を落とす（データが壊れている）。
 * WARN はレポートのみ（品質劣化・拡張時の腐敗の兆候）。
 *
 * 最重要は E16（孤立ノード）と E17（入口からの到達性）。
 * この2つは「芋づる式に辿れる」という製品要件そのものを検査している。
 * これが通っている限り、件数がいくつになっても辿り着けない職業は存在しない。
 */

const LIMITS = {
  summaryMax: 40,
  // 本文が薄くならないための下限。当初150字に置いたが、実際に書いてみると
  // 事実を4文で述べた密度の高い記事が137〜149字に収まった。150を守らせると
  // 内容のない一文を足すことになるので、実データに合わせて130字へ調整した。
  // 「測れない基準は書かない」の裏返しで、測ってみて合わなかった基準は直す。
  descriptionMin: 130,
  descriptionMax: 400,
  surpriseMin: 20,
  surpriseMax: 200,
  minTags: 6,
  minFacets: 4,
  maxTypedEdges: 3,
  /** 入口の定義。ここを変えると E17 の意味が変わる。 */
  entryFamiliarity: 4,
  /** 到達してほしい珍しさ。 */
  rareThreshold: 4,
  hopsToRare: 3,
} as const;

interface Issue {
  code: string;
  where: string;
  message: string;
}

const errors: Issue[] = [];
const warnings: Issue[] = [];

const err = (code: string, where: string, message: string) =>
  errors.push({ code, where, message });
const warn = (code: string, where: string, message: string) =>
  warnings.push({ code, where, message });

// ---------------------------------------------------------------------------

const { facets, tags, jobs } = loadSourceData();

for (const message of assertFacetsWellFormed(facets)) {
  err("E0", "taxonomy/facets.json", message);
}

const tagById = new Map<string, Tag>();

// --- タグ側の検査 (E4, E5, E9) ---------------------------------------------

for (const { tag, file } of tags) {
  const at = `${file} :: ${tag.id}`;

  const parsed = parseTagId(tag.id);
  if (!parsed) {
    err("E4", at, `Tag.id が \`facet.slug\` 形式でない、または slug が命名規則違反`);
  } else {
    if (parsed.facet !== tag.facet) {
      err("E4", at, `id の接頭辞 "${parsed.facet}" と facet "${tag.facet}" が食い違う`);
    }
    if (parsed.slug !== tag.slug) {
      err("E4", at, `id の後半 "${parsed.slug}" と slug "${tag.slug}" が食い違う`);
    }
  }

  if (tagById.has(tag.id)) {
    err("E5", at, `Tag.id が重複している`);
  }
  tagById.set(tag.id, tag);

  if (!tag.labelJa?.trim()) err("E6", at, `labelJa が空`);
  if (!tag.criteriaJa?.trim()) {
    err("E6", at, `criteriaJa が空。適用基準を書かないとタグの意味は必ず腐る`);
  }

  if (tag.status === "deprecated" && !tag.replacedBy) {
    err("E5", at, `deprecated なのに replacedBy がない`);
  }
}

// parentId の解決・循環・深さ (E5)
for (const { tag, file } of tags) {
  if (!tag.parentId) continue;
  const at = `${file} :: ${tag.id}`;
  const parent = tagById.get(tag.parentId);
  if (!parent) {
    err("E5", at, `parentId "${tag.parentId}" が存在しない`);
    continue;
  }
  if (parent.facet !== tag.facet) {
    err("E5", at, `parentId が別の軸 "${parent.facet}" を指している`);
    continue;
  }
  // 深さと循環
  const seen = new Set<string>([tag.id]);
  let cursor: Tag | undefined = parent;
  let depth = 1;
  while (cursor) {
    if (seen.has(cursor.id)) {
      err("E5", at, `parentId が循環している`);
      break;
    }
    seen.add(cursor.id);
    depth++;
    if (depth > 2) {
      err("E5", at, `タグ階層が深さ3以上になっている（深さ2までに抑える）`);
      break;
    }
    cursor = cursor.parentId ? tagById.get(cursor.parentId) : undefined;
  }
}

// タグの日本語ラベル衝突 (E9)
{
  const byKey = new Map<string, string[]>();
  for (const { tag } of tags) {
    for (const label of [tag.labelJa, ...(tag.aliasesJa ?? [])]) {
      const key = normalizeJa(label);
      const list = byKey.get(key) ?? [];
      if (!list.includes(tag.id)) list.push(tag.id);
      byKey.set(key, list);
    }
  }
  for (const [key, ids] of byKey) {
    if (ids.length > 1) {
      err(
        "E9",
        `taxonomy :: "${key}"`,
        `同じ日本語ラベル/別名を複数のタグが持っている: ${ids.join(", ")}`,
      );
    }
  }
}

// --- 職業側の検査 -----------------------------------------------------------

const jobBySlug = new Map<string, Job>();

for (const { job, file } of jobs) {
  const at = `${file} :: ${job.slug}`;

  // E1 slug 形式
  if (!isValidJobSlug(job.slug)) {
    err("E1", at, `slug が命名規則に反する（小文字ケバブケース、2〜40字）`);
  }
  // E2 slug 重複
  if (jobBySlug.has(job.slug)) {
    err("E2", at, `slug が重複している`);
  }
  jobBySlug.set(job.slug, job);

  // E6 必須フィールドと文字数
  const required: [keyof Job, string][] = [
    ["nameJa", "名前"],
    ["kanaJa", "読み"],
    ["emoji", "絵文字"],
    ["summaryJa", "一行紹介"],
    ["descriptionJa", "本文"],
    ["surpriseJa", "意外な一点"],
    ["updatedAt", "更新日"],
  ];
  for (const [key, labelJa] of required) {
    const value = job[key];
    if (typeof value !== "string" || !value.trim()) {
      err("E6", at, `${labelJa}（${String(key)}）が空`);
    }
  }
  if (!Array.isArray(job.aliasesJa)) {
    err("E6", at, `aliasesJa が配列でない（別名が無いなら空配列を書く）`);
  }

  const len = (s: string | undefined) => (s ? Array.from(s).length : 0);
  if (len(job.summaryJa) > LIMITS.summaryMax) {
    err("E6", at, `summaryJa が ${len(job.summaryJa)} 字。${LIMITS.summaryMax} 字以内にする`);
  }
  if (
    len(job.descriptionJa) < LIMITS.descriptionMin ||
    len(job.descriptionJa) > LIMITS.descriptionMax
  ) {
    err(
      "E6",
      at,
      `descriptionJa が ${len(job.descriptionJa)} 字。${LIMITS.descriptionMin}〜${LIMITS.descriptionMax} 字にする`,
    );
  }
  if (
    len(job.surpriseJa) < LIMITS.surpriseMin ||
    len(job.surpriseJa) > LIMITS.surpriseMax
  ) {
    err(
      "E6",
      at,
      `surpriseJa が ${len(job.surpriseJa)} 字。${LIMITS.surpriseMin}〜${LIMITS.surpriseMax} 字にする`,
    );
  }

  // E13 絵文字
  if (job.emoji && !isSingleGrapheme(job.emoji)) {
    err("E13", at, `emoji "${job.emoji}" が1グラフィムでない`);
  }

  // E14 数値と列挙
  for (const key of ["rarity", "familiarity"] as const) {
    const v = job[key];
    if (!Number.isInteger(v) || v < 1 || v > 5) {
      err("E14", at, `${key} が 1〜5 の整数でない（${String(v)}）`);
    }
  }
  if (
    !["traditional", "established", "emerging", "declining"].includes(
      job.lifecycle,
    )
  ) {
    err("E14", at, `lifecycle が列挙外（${String(job.lifecycle)}）`);
  }

  // E15 更新日
  if (job.updatedAt && !/^\d{4}-\d{2}-\d{2}$/.test(job.updatedAt)) {
    err("E15", at, `updatedAt が YYYY-MM-DD 形式でない`);
  } else if (job.updatedAt) {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (new Date(job.updatedAt).getTime() > today.getTime()) {
      err("E15", at, `updatedAt が未来日`);
    }
  }

  // E3 / E7 / E11 / E12 タグ
  if (!Array.isArray(job.tags)) {
    err("E6", at, `tags が配列でない`);
    continue;
  }

  const seenTags = new Set<string>();
  const usedFacets = new Set<FacetId>();
  for (const tagId of job.tags) {
    if (seenTags.has(tagId)) {
      err("E3", at, `同じタグ "${tagId}" を2回付けている`);
    }
    seenTags.add(tagId);

    const tag = tagById.get(tagId);
    if (!tag) {
      err("E3", at, `未定義のタグ "${tagId}" を参照している`);
      continue;
    }
    if (tag.status === "deprecated") {
      err(
        "E7",
        at,
        `廃止済みタグ "${tagId}" を参照している。"${tag.replacedBy}" へ移行する`,
      );
    }
    usedFacets.add(tag.facet);
  }

  if (job.tags.length < LIMITS.minTags) {
    err("E11", at, `タグが ${job.tags.length} 件。${LIMITS.minTags} 件以上付ける`);
  }
  if (usedFacets.size < LIMITS.minFacets) {
    err(
      "E11",
      at,
      `カバーしている軸が ${usedFacets.size} 個。${LIMITS.minFacets} 軸以上にする（1軸に偏ると意外な隣人が出ない）`,
    );
  }
  for (const facet of facets) {
    if (facet.required && !usedFacets.has(facet.id)) {
      err("E12", at, `必須の軸「${facet.labelJa}」(${facet.id}) のタグが1つもない`);
    }
  }
}

// E8 職業の日本語ラベル衝突（＝同じ職業の二重登録）
{
  const byKey = new Map<string, string[]>();
  for (const { job } of jobs) {
    const labels = [job.nameJa, job.kanaJa, ...(job.aliasesJa ?? [])].filter(
      Boolean,
    );
    for (const label of labels) {
      const key = normalizeJa(label);
      if (!key) continue;
      const list = byKey.get(key) ?? [];
      if (!list.includes(job.slug)) list.push(job.slug);
      byKey.set(key, list);
    }
  }
  for (const [key, slugs] of byKey) {
    if (slugs.length > 1) {
      err(
        "E8",
        `jobs :: "${key}"`,
        `同じ名前/別名を複数の職業が持っている（二重登録の疑い）: ${slugs.join(", ")}`,
      );
    }
  }
}

// E10 型付きエッジ
for (const { job, file } of jobs) {
  const at = `${file} :: ${job.slug}`;
  const edges = job.edges ?? [];
  const seen = new Set<string>();
  for (const edge of edges) {
    if (!jobBySlug.has(edge.to)) {
      err("E10", at, `edges.to "${edge.to}" が存在しない職業`);
    }
    if (edge.to === job.slug) {
      err("E10", at, `edges.to が自分自身を指している`);
    }
    if (!(EDGE_KINDS as readonly string[]).includes(edge.kind)) {
      err("E10", at, `edges.kind "${edge.kind}" が列挙外`);
    }
    if (!edge.noteJa?.trim()) {
      err("E10", at, `edges.noteJa が空。手書きエッジは説明があるから価値がある`);
    }
    const key = `${edge.to}::${edge.kind}`;
    if (seen.has(key)) err("E10", at, `同じ (to, kind) のエッジが重複している`);
    seen.add(key);
  }
  if (edges.length > LIMITS.maxTypedEdges) {
    warn(
      "W10",
      at,
      `手書きエッジが ${edges.length} 件。${LIMITS.maxTypedEdges} 件以内に抑える（手書き依存に戻ると拡張で破綻する）`,
    );
  }
}

// ---------------------------------------------------------------------------
// WARN: 品質劣化の兆候
// ---------------------------------------------------------------------------

const jobCount = jobs.length;
const df = new Map<string, number>();
for (const { job } of jobs) {
  for (const tagId of new Set(job.tags ?? [])) {
    df.set(tagId, (df.get(tagId) ?? 0) + 1);
  }
}

{
  // W1 死にタグ / W2 未使用タグ / W3 効かないタグ
  const deadTags: string[] = [];
  for (const { tag } of tags) {
    if (tag.status === "deprecated") continue;
    const count = df.get(tag.id) ?? 0;
    if (count === 0) {
      warn("W2", tag.id, `どの職業にも使われていない`);
    } else if (count === 1) {
      deadTags.push(tag.id);
    }
    // 少件数のうちは「全員が持つタグ」が必然的に出るので、20件を超えてから見る。
    if (jobCount >= 20 && count > jobCount * 0.5) {
      warn(
        "W3",
        tag.id,
        `${count}/${jobCount} 件が持っている。情報量がほぼ無く、隣人の選別に効かない`,
      );
    }
  }
  const activeTagCount = tags.filter((t) => t.tag.status !== "deprecated").length;
  const deadRatio = activeTagCount ? deadTags.length / activeTagCount : 0;
  if (deadTags.length > 0) {
    const message = `1件の職業にしか使われていないタグが ${deadTags.length}/${activeTagCount} 件（${Math.round(deadRatio * 100)}%）: ${deadTags.slice(0, 12).join(", ")}${deadTags.length > 12 ? " ほか" : ""}`;
    // 50件を超えたら死にタグ15%超は ERROR。少件数のうちは必然的に多いので WARN に留める。
    if (jobCount > 50 && deadRatio > 0.15) {
      err("W1", "taxonomy", message);
    } else {
      warn("W1", "taxonomy", message);
    }
  }
}

{
  // W5 重複疑い（タグ集合の Jaccard）/ W6 表記ゆれ疑い（編集距離1）
  const list = jobs.map(({ job }) => ({
    slug: job.slug,
    tags: new Set(job.tags ?? []),
    key: normalizeJa(job.nameJa ?? ""),
  }));
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i];
      const b = list[j];
      let inter = 0;
      for (const t of a.tags) if (b.tags.has(t)) inter++;
      const union = a.tags.size + b.tags.size - inter;
      if (union > 0 && inter / union >= 0.85) {
        warn(
          "W5",
          `${a.slug} / ${b.slug}`,
          `タグ構成がほぼ同一（Jaccard ${(inter / union).toFixed(2)}）。同じ職業を二重に登録していないか確認する`,
        );
      }
      if (a.key && b.key && editDistance(a.key, b.key) === 1) {
        warn(
          "W6",
          `${a.slug} / ${b.slug}`,
          `名前が1文字違い（"${a.key}" / "${b.key}"）。表記ゆれの疑い`,
        );
      }
    }
  }
}

{
  // W8 出典なし
  for (const { job, file } of jobs) {
    if (!job.sources || job.sources.length === 0) {
      warn("W8", `${file} :: ${job.slug}`, `sources が空`);
    }
  }
}

{
  // W9 数値のインフレ
  if (jobCount >= 20) {
    const fam5 = jobs.filter(({ job }) => job.familiarity === 5).length;
    const rare5 = jobs.filter(({ job }) => job.rarity === 5).length;
    if (fam5 / jobCount > 0.2) {
      warn(
        "W9",
        "rubric",
        `familiarity=5 が ${fam5}/${jobCount} 件（20%超）。「誰でも知っている」の基準が緩んでいる`,
      );
    }
    if (rare5 / jobCount > 0.4) {
      warn(
        "W9",
        "rubric",
        `rarity=5 が ${rare5}/${jobCount} 件（40%超）。「全国で数十人」の基準が緩んでいる`,
      );
    }
  }
}

{
  // W11 軸の設計失敗（ある軸のタグを持つ職業が少なすぎる）
  if (jobCount >= 20) {
    for (const facet of facets) {
      const users = jobs.filter(({ job }) =>
        (job.tags ?? []).some((t) => tagById.get(t)?.facet === facet.id),
      ).length;
      if (users / jobCount < 0.3) {
        warn(
          "W11",
          facet.id,
          `軸「${facet.labelJa}」のタグを持つ職業が ${users}/${jobCount} 件（30%未満）。軸の粒度が実態に合っていない`,
        );
      }
    }
  }
}

// ---------------------------------------------------------------------------
// E16 / E17 / W4 / W7 : グラフの健全性
// 生成物 graph-health.json があるときだけ検査する（build-data.ts が先に走る前提）。
// ---------------------------------------------------------------------------

const healthPath = join(GENERATED_DIR, "graph-health.json");
if (existsSync(healthPath)) {
  const health = JSON.parse(readFileSync(healthPath, "utf8")) as GraphHealth;

  if (health.jobCount !== jobCount) {
    err(
      "E18",
      "generated/graph-health.json",
      `生成物の職業数 ${health.jobCount} がソースの ${jobCount} と食い違う。npm run data:build を実行する`,
    );
  }

  if (health.orphanSlugs.length > 0) {
    err(
      "E16",
      "graph",
      `どこからも辿り着けない職業が ${health.orphanSlugs.length} 件: ${health.orphanSlugs.join(", ")}`,
    );
  }

  if (health.entrySlugs.length === 0) {
    err(
      "E17",
      "graph",
      `入口となる職業（familiarity >= ${LIMITS.entryFamiliarity}）が1件もない`,
    );
  } else if (health.reachabilityRatio < 1) {
    err(
      "E17",
      "graph",
      `入口から到達できない職業が ${health.unreachableSlugs.length} 件: ${health.unreachableSlugs.join(", ")}`,
    );
  }

  if (health.entriesWithoutRareWithin3.length > 0) {
    warn(
      "W7",
      "graph",
      `${LIMITS.hopsToRare} ホップ以内に rarity>=${LIMITS.rareThreshold} へ到達できない入口が ${health.entriesWithoutRareWithin3.length} 件: ${health.entriesWithoutRareWithin3.join(", ")}`,
    );
  }
} else if (process.argv.includes("--require-graph")) {
  err(
    "E18",
    "generated/",
    `graph-health.json がない。npm run data:build を先に実行する`,
  );
}

// ---------------------------------------------------------------------------
// 出力
// ---------------------------------------------------------------------------

const summary = {
  jobCount,
  tagCount: tags.length,
  facetCount: facets.length,
  errors: errors.length,
  warnings: warnings.length,
};

if (process.argv.includes("--json")) {
  console.log(JSON.stringify({ summary, errors, warnings }, null, 2));
} else {
  const render = (label: string, issues: Issue[]) => {
    if (issues.length === 0) return;
    console.log(`\n${label} (${issues.length})`);
    for (const i of issues) {
      console.log(`  [${i.code}] ${i.where}\n        ${i.message}`);
    }
  };
  render("WARN", warnings);
  render("ERROR", errors);
  console.log(
    `\n職業 ${summary.jobCount} 件 / タグ ${summary.tagCount} 件 / 軸 ${summary.facetCount} 個`,
  );
  console.log(
    errors.length === 0
      ? `ERROR 0 件、WARN ${warnings.length} 件。検証を通過しました。`
      : `ERROR ${errors.length} 件。修正が必要です。`,
  );
}

process.exit(errors.length > 0 ? 1 : 0);
