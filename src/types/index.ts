/**
 * しごと図鑑のデータモデル。
 *
 * 設計の中心にある制約はひとつ:
 * **タグは自由文字列にしない**。すべてタクソノミーに定義された `Tag.id` への参照であり、
 * 未定義の参照は scripts/validate.ts が機械的に落とす。
 * 50件を2000件に増やしても表記ゆれが発生しないのは、この一点による。
 */

// ---------------------------------------------------------------------------
// ファセット（タグの軸）
// ---------------------------------------------------------------------------

/**
 * 7つの軸。増やすと1職業あたりのタグ付けコストが上がり、
 * データ拡充が止まる（拡張の真のボトルネックはタグ付けの手間）ので7つに留める。
 */
export const FACET_IDS = [
  "setting", // 舞台・環境（どこで）
  "subject", // 扱う対象（何を）
  "action", // 動作・動詞（どうする）
  "sense", // 使う感覚・身体性
  "condition", // 就労条件・制度
  "temperament", // 向いている気質
  "industry", // 業界・産業
] as const;

export type FacetId = (typeof FACET_IDS)[number];

export interface Facet {
  id: FacetId;
  labelJa: string;
  /** この軸が何を問うか。UIの見出しに使う。 */
  questionJa: string;
  emoji: string;
  /**
   * 類似度計算での軸の重み。
   * sense/action を高くするのは、この2軸の共有だけが業界横断の意外な隣人を生むから。
   * industry を低くするのは自明で情報量が薄いから（ただし0にはしない。
   * 「まず地に足のついた隣人」を1〜2件確保する役割がある）。
   */
  weight: number;
  /** この軸のタグを最低1つ必須にするか。 */
  required: boolean;
  /**
   * エゴネットワーク図でのセクター方向を決める。
   * ここが固定だから、再訪したとき同じ絵になり「場所の記憶」ができる。
   */
  order: number;
}

// ---------------------------------------------------------------------------
// タグ
// ---------------------------------------------------------------------------

export type TagStatus = "active" | "deprecated";

export interface Tag {
  /** `${facet}.${slug}` 形式。例: "sense.smell" */
  id: string;
  facet: FacetId;
  slug: string;
  labelJa: string;
  /** 表記ゆれの吸収先。新規タグ作成時に既存との衝突検出に使う。 */
  aliasesJa?: string[];
  /** 適用基準。誤用を防ぐための散文。存在のみ機械検査する。 */
  criteriaJa: string;
  /** 上位タグ。深さ2まで（早すぎる階層化は無駄なので v1 では最小限）。 */
  parentId?: string;
  status?: TagStatus;
  /** deprecated のときは必須。移行先。 */
  replacedBy?: string;
}

// ---------------------------------------------------------------------------
// 職業
// ---------------------------------------------------------------------------

/** 珍度。従事者の少なさ。 */
export type Rarity = 1 | 2 | 3 | 4 | 5;
/** 既知度。名前を聞いたことがある人の多さ。rarity とは独立。 */
export type Familiarity = 1 | 2 | 3 | 4 | 5;

export type Lifecycle =
  | "traditional" // 古くから続く
  | "established" // 定着している
  | "emerging" // 生まれたばかり・増えている
  | "declining"; // 減っている・機械に置き換わりつつある

export interface Source {
  titleJa: string;
  url: string;
  publisherJa?: string;
}

export const EDGE_KINDS = [
  "same-site", // 同じ現場にいる別の役割
  "transitions-to", // ここから転じる
  "front-and-back", // 表と裏
  "supplies", // 素材・道具を供給する
  "modern-successor", // 現代版・後継
  "confusable", // 似て非なる（混同されがち）
] as const;

export type EdgeKind = (typeof EDGE_KINDS)[number];

/** 共有タグからは絶対に導出できない関係だけを手書きする。1職業あたり0〜3件。 */
export interface TypedEdge {
  to: string;
  kind: EdgeKind;
  noteJa: string;
}

export interface Job {
  /** 永久不変の主キー兼URL。命名規則は scripts/validate.ts の E1 を参照。 */
  slug: string;
  nameJa: string;
  nameEn?: string;
  /** 別名・旧称・俗称。重複登録の検出キーでもある。 */
  aliasesJa: string[];
  /** 読み。ソート・検索・重複検出に使う。 */
  kanaJa: string;
  /** ノード表示用。1グラフィム。 */
  emoji: string;
  /** 一行・40字以内。 */
  summaryJa: string;
  /** 150〜400字。 */
  descriptionJa: string;
  /** 「知らなかった」を作る一点。この図鑑の価値の中心なので必須。 */
  surpriseJa: string;
  aDayJa?: string;
  howToBecomeJa?: string;
  /** Tag.id の配列。6件以上・4ファセット以上。 */
  tags: string[];
  rarity: Rarity;
  familiarity: Familiarity;
  lifecycle: Lifecycle;
  edges?: TypedEdge[];
  sources?: Source[];
  /** "YYYY-MM-DD" */
  updatedAt: string;
}

/** src/data/jobs/*.json のファイル形式。 */
export interface JobFile {
  industry: string;
  jobs: Job[];
}

/** src/data/taxonomy/tags/*.json のファイル形式。 */
export interface TagFile {
  facet: FacetId;
  tags: Tag[];
}

// ---------------------------------------------------------------------------
// 導出結果（src/data/generated/neighbors.json）
// ---------------------------------------------------------------------------

export interface SharedTag {
  id: string;
  facet: FacetId;
  /** このタグがスコアに寄与した量。降順に並ぶ。 */
  contribution: number;
}

export interface DerivedNeighbor {
  slug: string;
  score: number;
  /** 寄与降順・最大4件。 */
  sharedTags: SharedTag[];
  /** 最も寄与した軸。図のセクター割当に使う。 */
  dominantFacet: FacetId;
  /** 「なぜ繋がっているか」のテンプレ生成文。 */
  reasonJa: string;
  /** 軸ごとの寄与合計。クライアント側の軸絞り込みに使う。 */
  byFacet: Partial<Record<FacetId, number>>;
  /** 手書きの型付きエッジ由来なら、その情報。 */
  typed?: { kind: EdgeKind; noteJa: string; direction: "out" | "in" };
}

/** 図の楽観遷移のために持つ、2ホップ先の軽量スタブ。 */
export interface JobStub {
  slug: string;
  nameJa: string;
  emoji: string;
}

export interface NeighborEntry {
  slug: string;
  /** 上位24件のプール。表示は14件だが、軸で絞っても枯渇しないよう多めに持つ。 */
  neighbors: DerivedNeighbor[];
  /** 隣人slug -> その隣人の隣人スタブ（上位8件）。 */
  stubs: Record<string, JobStub[]>;
}

// ---------------------------------------------------------------------------
// 生成物のその他
// ---------------------------------------------------------------------------

export interface TaxonomyTag extends Tag {
  /** このタグを持つ職業数（document frequency）。 */
  df: number;
}

export interface GeneratedTaxonomy {
  facets: Facet[];
  tags: TaxonomyTag[];
  jobCount: number;
}

export interface GraphHealth {
  jobCount: number;
  tagCount: number;
  /** 平均次数（上位8隣人を無向化したグラフ）。 */
  averageDegree: number;
  /** 入次数0の職業。0件でなければならない（E16）。 */
  orphanSlugs: string[];
  /** 入口職業（familiarity >= 4）。 */
  entrySlugs: string[];
  /** 入口集合からのBFSで到達できた割合。1 でなければならない（E17）。 */
  reachabilityRatio: number;
  /** 到達できなかった職業。 */
  unreachableSlugs: string[];
  /** 各入口から rarity >= 4 の職業へ到達するのに必要なホップ数の平均。 */
  averageHopsToRare: number;
  /** 3ホップ以内に rarity >= 4 へ到達できない入口（W7）。 */
  entriesWithoutRareWithin3: string[];
}
