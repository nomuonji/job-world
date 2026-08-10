import { FACET_IDS, type FacetId } from "@/types";

/**
 * 命名規則と、日本語の重複検出。
 * データが2000件に増えても表記ゆれが混入しないための土台。
 */

/** Job.slug の形式。単数形の職業名詞、2〜40字、ケバブケース。 */
export const JOB_SLUG_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
export const JOB_SLUG_MIN = 2;
export const JOB_SLUG_MAX = 40;

export function isValidJobSlug(slug: string): boolean {
  return (
    slug.length >= JOB_SLUG_MIN &&
    slug.length <= JOB_SLUG_MAX &&
    JOB_SLUG_PATTERN.test(slug)
  );
}

/** Tag.id は `${facet}.${slug}`。軸を跨いだ同名衝突を防ぎ、参照文字列だけで軸が判る。 */
export function buildTagId(facet: FacetId, slug: string): string {
  return `${facet}.${slug}`;
}

export function parseTagId(
  id: string,
): { facet: FacetId; slug: string } | null {
  const dot = id.indexOf(".");
  if (dot <= 0) return null;
  const facet = id.slice(0, dot);
  const slug = id.slice(dot + 1);
  if (!(FACET_IDS as readonly string[]).includes(facet)) return null;
  if (!isValidJobSlug(slug)) return null;
  return { facet: facet as FacetId, slug };
}

/**
 * 日本語の正規化キー。
 * 「刀剣研師」「刀剣とぎ師」「トウケントギシ」を同じキーに潰し、
 * 同じ職業を別 slug で二重登録するのを検出する（validate.ts の E8/E9）。
 *
 * 長音・中黒・各種ダッシュを除去するのは、「パティシエ」と「パテイシエ」、
 * 「ソムリエ」と「ソム・リエ」のような揺れを吸収するため。
 */
export function normalizeJa(input: string): string {
  return input
    .normalize("NFKC")
    .replace(/[\s　]/g, "")
    .replace(/[・･‐‑‒–—―ー−\-]/g, "")
    .replace(/[ァ-ヶ]/g, (c) =>
      String.fromCharCode(c.charCodeAt(0) - 0x60),
    )
    .toLowerCase();
}

/**
 * レーベンシュタイン距離。表記ゆれ「疑い」の検出（W6）に使う。
 * 完全一致は E8/E9 が落とすので、ここが拾うのは1文字違いの取りこぼし。
 */
export function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    prev = curr;
  }
  return prev[b.length];
}

/** 絵文字が1グラフィムかを判定する（E13）。ZWJ結合や異体字セレクタも1つと数える。 */
export function isSingleGrapheme(s: string): boolean {
  if (s.length === 0) return false;
  const Seg = (
    Intl as unknown as { Segmenter?: typeof Intl.Segmenter }
  ).Segmenter;
  if (!Seg) return Array.from(s).length <= 2;
  const segmenter = new Seg("ja", { granularity: "grapheme" });
  return Array.from(segmenter.segment(s)).length === 1;
}
