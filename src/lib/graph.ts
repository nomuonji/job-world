import type {
  DerivedNeighbor,
  EdgeKind,
  Facet,
  FacetId,
  Job,
  SharedTag,
  Tag,
} from "@/types";

/**
 * 隣人の導出。この図鑑の製品コンセプトの実体。
 *
 * 手書きの関連リンクは件数の2乗で破綻するので、隣人は共有タグから自動導出する。
 * ただの共有タグ数では「同じ業界か」に潰れてしまうため、
 *   ・タグの希少度(IDF)で重み付けし、レアなタグの共有ほど強く効かせる
 *   ・軸(ファセット)ごとに重みを変え、sense/action の共有を業界の共有より重く見る
 *   ・業界を跨いだ相手にブーストをかける
 *   ・MMRで隣人同士の似すぎを抑え、別方向に散らす
 * という4段構えで「意外な隣人」を上位に出す。
 *
 * ここの重み設定を等倍にすると、パティシエの隣人は
 * 「ショコラティエ・ブーランジェ・和菓子職人」で埋まり、2ホップ目も製菓業界から出られない。
 */

export const TUNING = {
  /** 業界タグが全く重ならない相手へのブースト。 */
  crossIndustryBoost: 0.35,
  /** rarity が高い相手へのブースト（探索を珍しい方へ誘導する）。 */
  rarityBoost: 0.2,
  /** 共有タグが industry だけの相手への減点（「同業界なだけ」を沈める）。 */
  industryOnlyPenalty: 0.15,
  /** MMR: スコア重視と多様性重視の配分。 */
  mmrLambda: 0.7,
  /** 手書きエッジが確保する最低スコア。必ず表示させる。 */
  typedEdgeFloor: 0.6,
  /** 保存する隣人プールの件数。表示は14件だが軸で絞っても枯渇しないよう多めに持つ。 */
  poolSize: 24,
  /** 相互性・孤立判定に使う「上位何件までを本当の隣人と見なすか」。 */
  coreSize: 8,
} as const;

export const EDGE_KIND_LABEL: Record<EdgeKind, string> = {
  "same-site": "同じ現場にいる",
  "transitions-to": "ここから転じる",
  "front-and-back": "表と裏",
  supplies: "素材・道具を供給する",
  "modern-successor": "現代版・後継",
  confusable: "似て非なる",
};

/** 逆向きから見たときのラベル。 */
export const EDGE_KIND_REVERSE_LABEL: Record<EdgeKind, string> = {
  "same-site": "同じ現場にいる",
  "transitions-to": "ここへ転じてくる",
  "front-and-back": "表と裏",
  supplies: "ここへ供給される",
  "modern-successor": "その前身",
  confusable: "似て非なる",
};

export interface GraphContext {
  jobs: Job[];
  tagById: Map<string, Tag>;
  facetById: Map<FacetId, Facet>;
  /** タグID -> そのタグを持つ職業数。祖先展開後の値。 */
  df: Map<string, number>;
  /** 職業slug -> 祖先展開済みのタグ集合。 */
  expandedTags: Map<string, Set<string>>;
  /** タグID -> idf。 */
  idf: Map<string, number>;
  jobBySlug: Map<string, Job>;
}

/**
 * タグ集合に祖先タグを足す。
 * 「刀剣研師の action.polish」と「別の職人の action.carve」が
 * 親の action.shave で緩く繋がる余地を残すため。
 * 祖先は df が大きく idf が小さいので、寄与は自動的に小さくなる。
 */
function expandWithAncestors(
  tagIds: string[],
  tagById: Map<string, Tag>,
): Set<string> {
  const out = new Set<string>();
  for (const id of tagIds) {
    let cursor = tagById.get(id);
    let guard = 0;
    while (cursor && guard++ < 4) {
      out.add(cursor.id);
      cursor = cursor.parentId ? tagById.get(cursor.parentId) : undefined;
    }
  }
  return out;
}

export function buildContext(
  jobs: Job[],
  tagList: Tag[],
  facets: Facet[],
): GraphContext {
  const tagById = new Map(tagList.map((t) => [t.id, t]));
  const facetById = new Map(facets.map((f) => [f.id, f]));

  const expandedTags = new Map<string, Set<string>>();
  const df = new Map<string, number>();
  for (const job of jobs) {
    const expanded = expandWithAncestors(job.tags, tagById);
    expandedTags.set(job.slug, expanded);
    for (const id of expanded) df.set(id, (df.get(id) ?? 0) + 1);
  }

  const n = jobs.length;
  const idf = new Map<string, number>();
  for (const [id, count] of df) {
    // 標準的なIDFに +1 して、頻出タグでも寄与が0にならないようにする。
    idf.set(id, Math.log((n + 1) / (count + 1)) + 1);
  }

  return {
    jobs,
    tagById,
    facetById,
    df,
    expandedTags,
    idf,
    jobBySlug: new Map(jobs.map((j) => [j.slug, j])),
  };
}

function facetWeight(ctx: GraphContext, tagId: string): number {
  const tag = ctx.tagById.get(tagId);
  if (!tag) return 0;
  return ctx.facetById.get(tag.facet)?.weight ?? 1;
}

/**
 * ベクトルのノルム。成分は sqrt(facetWeight) * idf なので、
 * 内積の1項が facetWeight * idf^2 になり、重み付きコサイン類似度として整合する。
 * 正規化しないとタグを多く付けた職業がハブ化する。
 */
function norm(ctx: GraphContext, slug: string): number {
  let sum = 0;
  for (const id of ctx.expandedTags.get(slug) ?? []) {
    const w = facetWeight(ctx, id);
    const i = ctx.idf.get(id) ?? 0;
    sum += w * i * i;
  }
  return Math.sqrt(sum) || 1;
}

export interface SimilarityResult {
  sim: number;
  sharedTags: SharedTag[];
  byFacet: Partial<Record<FacetId, number>>;
}

/** 重み付きコサイン類似度と、その内訳。 */
export function similarity(
  ctx: GraphContext,
  a: string,
  b: string,
  normA = norm(ctx, a),
  normB = norm(ctx, b),
): SimilarityResult {
  const tagsA = ctx.expandedTags.get(a);
  const tagsB = ctx.expandedTags.get(b);
  const sharedTags: SharedTag[] = [];
  const byFacet: Partial<Record<FacetId, number>> = {};
  if (!tagsA || !tagsB) return { sim: 0, sharedTags, byFacet };

  // 小さい方を回す。
  const [small, large] = tagsA.size <= tagsB.size ? [tagsA, tagsB] : [tagsB, tagsA];
  let dot = 0;
  for (const id of small) {
    if (!large.has(id)) continue;
    const tag = ctx.tagById.get(id);
    if (!tag) continue;
    const i = ctx.idf.get(id) ?? 0;
    const contribution = facetWeight(ctx, id) * i * i;
    dot += contribution;
    sharedTags.push({ id, facet: tag.facet, contribution });
    byFacet[tag.facet] = (byFacet[tag.facet] ?? 0) + contribution;
  }

  const denom = normA * normB;
  const sim = denom > 0 ? dot / denom : 0;

  // 正規化後の寄与に直しておく（UIで比較可能な値にするため）。
  for (const t of sharedTags) t.contribution = t.contribution / denom;
  for (const key of Object.keys(byFacet) as FacetId[]) {
    byFacet[key] = (byFacet[key] ?? 0) / denom;
  }
  sharedTags.sort((x, y) => y.contribution - x.contribution);

  return { sim, sharedTags, byFacet };
}

/** 意外性ブースト。「同業界なだけ」を沈め、業界を跨いだ珍しい相手を押し上げる。 */
export function surpriseFactor(
  ctx: GraphContext,
  from: Job,
  to: Job,
  sharedTags: SharedTag[],
): number {
  const industriesFrom = new Set(
    from.tags.filter((t) => ctx.tagById.get(t)?.facet === "industry"),
  );
  const sharesIndustry = to.tags.some(
    (t) => ctx.tagById.get(t)?.facet === "industry" && industriesFrom.has(t),
  );
  const onlyIndustry =
    sharedTags.length > 0 && sharedTags.every((t) => t.facet === "industry");

  let factor = 1;
  if (!sharesIndustry) factor += TUNING.crossIndustryBoost;
  factor +=
    TUNING.rarityBoost * Math.min(1, Math.max(0, (to.rarity - 3) / 2));
  if (onlyIndustry) factor -= TUNING.industryOnlyPenalty;
  return factor;
}

/** 「なぜ繋がっているか」の説明文。図のツールチップと関連職業リストに出る。 */
export function buildReason(
  ctx: GraphContext,
  from: Job,
  to: Job,
  sharedTags: SharedTag[],
): string {
  const labels = sharedTags
    .filter((t) => t.facet !== "industry")
    .slice(0, 2)
    .map((t) => `〈${ctx.tagById.get(t.id)?.labelJa ?? t.id}〉`);

  if (labels.length === 0) {
    const industry = sharedTags.find((t) => t.facet === "industry");
    const label = industry
      ? ctx.tagById.get(industry.id)?.labelJa
      : undefined;
    return label ? `同じ〈${label}〉の世界にいる仕事。` : "近い性質を持つ仕事。";
  }

  const industriesFrom = new Set(
    from.tags.filter((t) => ctx.tagById.get(t)?.facet === "industry"),
  );
  const sharesIndustry = to.tags.some(
    (t) => ctx.tagById.get(t)?.facet === "industry" && industriesFrom.has(t),
  );

  const body =
    labels.length === 1
      ? `どちらも${labels[0]}仕事。`
      : `どちらも${labels[0]}${labels[1]}という共通点がある。`;

  return sharesIndustry ? body : `業界は違うが、${body}`;
}

/**
 * 1職業についての隣人プールを作る。
 *
 * 計算は全ペア O(N^2) ではなく、タグ→職業の転置インデックスで
 * 「共有タグを持つ相手」だけを候補にする。
 */
export function deriveNeighbors(
  ctx: GraphContext,
  inverted: Map<string, string[]>,
  norms: Map<string, number>,
  job: Job,
): DerivedNeighbor[] {
  const n = ctx.jobs.length;
  // あまりに一般的なタグは候補列挙のトリガーにしない（スコア計算には使う）。
  const triggerLimit = Math.max(3, n * 0.25);

  const candidates = new Set<string>();
  for (const tagId of ctx.expandedTags.get(job.slug) ?? []) {
    const holders = inverted.get(tagId);
    if (!holders) continue;
    if (holders.length > triggerLimit && candidates.size > 0) continue;
    for (const slug of holders) {
      if (slug !== job.slug) candidates.add(slug);
    }
  }

  const normA = norms.get(job.slug) ?? 1;
  const scored: (DerivedNeighbor & { sim: number })[] = [];

  for (const slug of candidates) {
    const other = ctx.jobBySlug.get(slug);
    if (!other) continue;
    const { sim, sharedTags, byFacet } = similarity(
      ctx,
      job.slug,
      slug,
      normA,
      norms.get(slug) ?? 1,
    );
    if (sim <= 0) continue;

    const score = sim * surpriseFactor(ctx, job, other, sharedTags);
    const dominantFacet = sharedTags[0]?.facet ?? "industry";

    scored.push({
      slug,
      score,
      sim,
      sharedTags: sharedTags.slice(0, 4),
      dominantFacet,
      reasonJa: buildReason(ctx, job, other, sharedTags),
      byFacet,
    });
  }

  scored.sort((a, b) => b.score - a.score);

  // MMR: 既に選んだ隣人と似すぎている候補を減点し、別方向に散らす。
  // エゴネットワークの体験の質はここで決まる（同じクラスタの8件では発見がない）。
  const selected: (DerivedNeighbor & { sim: number })[] = [];
  const pool = [...scored];
  while (selected.length < TUNING.poolSize && pool.length > 0) {
    let bestIndex = 0;
    let bestValue = -Infinity;
    for (let i = 0; i < pool.length; i++) {
      const candidate = pool[i];
      let maxSimToSelected = 0;
      for (const chosen of selected) {
        const s = similarity(
          ctx,
          candidate.slug,
          chosen.slug,
          norms.get(candidate.slug) ?? 1,
          norms.get(chosen.slug) ?? 1,
        ).sim;
        if (s > maxSimToSelected) maxSimToSelected = s;
      }
      const value =
        TUNING.mmrLambda * candidate.score -
        (1 - TUNING.mmrLambda) * maxSimToSelected;
      if (value > bestValue) {
        bestValue = value;
        bestIndex = i;
      }
    }
    selected.push(pool.splice(bestIndex, 1)[0]);
  }

  // sim は MMR の計算にだけ使う内部値なので、保存する隣人からは落とす。
  return selected.map((n): DerivedNeighbor => ({
    slug: n.slug,
    score: n.score,
    sharedTags: n.sharedTags,
    dominantFacet: n.dominantFacet,
    reasonJa: n.reasonJa,
    byFacet: n.byFacet,
    ...(n.typed ? { typed: n.typed } : {}),
  }));
}

export function invertedIndex(ctx: GraphContext): Map<string, string[]> {
  const inverted = new Map<string, string[]>();
  for (const job of ctx.jobs) {
    for (const tagId of ctx.expandedTags.get(job.slug) ?? []) {
      const list = inverted.get(tagId) ?? [];
      list.push(job.slug);
      inverted.set(tagId, list);
    }
  }
  return inverted;
}

export function allNorms(ctx: GraphContext): Map<string, number> {
  return new Map(ctx.jobs.map((j) => [j.slug, norm(ctx, j.slug)]));
}
