/**
 * 本番に出る静的HTML（out/）を直接検査する。
 *
 * 見ているのは、検索エンジンが実際に受け取るものだけ:
 *  - sitemap.xml に載っているURL（= 検索面に出す約束をしたページ）
 *  - そのうち構造化データを持つページ数 / JSON.parse できるか
 *  - meta description の長さ
 *  - <main> の本文文字数（薄いページの検出）
 *
 * 方針: sitemap に載せたページは「本文800字以上・description 90〜160字・JSON-LDあり」を
 * 満たすこと。満たせないページは noindex にしてsitemapから外す（水増しはしない）。
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const OUT = "out";
const MIN_TEXT = 800;
const MIN_DESCRIPTION = 90;
const MAX_DESCRIPTION = 160;

type PageReport = {
  url: string;
  path: string;
  textLength: number;
  descriptionLength: number;
  jsonLdBlocks: number;
  jsonLdTypes: string[];
  jsonLdErrors: string[];
  noindex: boolean;
  inSitemap: boolean;
};

function fail(message: string): never {
  console.error(`[seo:verify] FAIL: ${message}`);
  process.exit(1);
}

function decodeEntities(input: string): string {
  return input
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
      String.fromCodePoint(parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

/** <main> の中の、人が読む文字だけを取り出す。 */
function mainTextLength(html: string): number {
  const start = html.search(/<main[\s>]/);
  if (start < 0) return 0;
  const openEnd = html.indexOf(">", start);
  const end = html.indexOf("</main>", openEnd);
  if (openEnd < 0 || end < 0) return 0;
  const inner = html
    .slice(openEnd + 1, end)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");
  const text = decodeEntities(inner.replace(/<[^>]+>/g, " "));
  return text.replace(/\s+/g, "").length;
}

function metaDescription(html: string): string {
  const match = html.match(
    /<meta[^>]+name="description"[^>]+content="([^"]*)"/i,
  );
  return match ? decodeEntities(match[1]) : "";
}

/** dangerouslySetInnerHTML 由来のエスケープや属性順の揺れを吸収する。 */
function jsonLdBlocks(html: string): string[] {
  const blocks: string[] = [];
  const re = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) blocks.push(match[1]);
  return blocks;
}

function collectTypes(value: unknown, into: Set<string>): void {
  if (Array.isArray(value)) {
    for (const item of value) collectTypes(item, into);
    return;
  }
  if (!value || typeof value !== "object") return;
  const node = value as Record<string, unknown>;
  const type = node["@type"];
  if (typeof type === "string") into.add(type);
  if (Array.isArray(type)) {
    for (const item of type) if (typeof item === "string") into.add(item);
  }
  for (const child of Object.values(node)) {
    if (child && typeof child === "object") collectTypes(child, into);
  }
}

/**
 * Next.js の static export は trailingSlash: false なので `jobs.html` 形式で出す
 * （Cloudflare Pages が /jobs に割り当てる）。`index.html` 形式も一応見る。
 */
function urlToFile(url: string): string | undefined {
  const parsed = new URL(url);
  if (!parsed.pathname || parsed.pathname === "/") return join(OUT, "index.html");
  const segments = parsed.pathname.replace(/\/$/, "").split("/").filter(Boolean);
  const flat = join(OUT, `${segments.join("/")}.html`);
  if (existsSync(flat)) return flat;
  const nested = join(OUT, ...segments, "index.html");
  if (existsSync(nested)) return nested;
  return undefined;
}

if (!existsSync(join(OUT, "sitemap.xml"))) {
  fail("out/sitemap.xml がありません。先にビルドしてください。");
}

const sitemapXml = readFileSync(join(OUT, "sitemap.xml"), "utf8");
const sitemapUrls = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) =>
  m[1].trim(),
);

const report: PageReport[] = [];
for (const url of sitemapUrls) {
  const file = urlToFile(url);
  if (!file) fail(`sitemapにあるURLのHTMLが生成されていません: ${url}`);
  const html = readFileSync(file, "utf8");
  const blocks = jsonLdBlocks(html);
  const types = new Set<string>();
  const errors: string[] = [];
  for (const block of blocks) {
    try {
      collectTypes(JSON.parse(block), types);
    } catch (error) {
      errors.push(
        `${file}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  report.push({
    url,
    path: file,
    textLength: mainTextLength(html),
    descriptionLength: metaDescription(html).length,
    jsonLdBlocks: blocks.length,
    jsonLdTypes: [...types].sort(),
    jsonLdErrors: errors,
    noindex: /<meta[^>]+name="robots"[^>]+content="[^"]*noindex/i.test(html),
    inSitemap: true,
  });
}

// sitemap に載っていないページ（タグ探索ページ・404など）も、JSON-LDが壊れていないかは見る。
const extraPages = ["404.html", "_not-found.html"];
for (const page of extraPages) {
  const file = join(OUT, page);
  if (!existsSync(file)) continue;
  const html = readFileSync(file, "utf8");
  for (const block of jsonLdBlocks(html)) {
    try {
      JSON.parse(block);
    } catch (error) {
      fail(`${page}: JSON-LD がパースできません (${String(error)})`);
    }
  }
}

const parseFailures = report.filter((page) => page.jsonLdErrors.length > 0);
const missing = report.filter((page) => page.jsonLdBlocks === 0);
const thin = report.filter((page) => page.textLength < MIN_TEXT);
const shortDescription = report.filter(
  (page) =>
    page.descriptionLength < MIN_DESCRIPTION ||
    page.descriptionLength > MAX_DESCRIPTION,
);
const indexable = report.filter((page) => !page.noindex);

const typeTotals = new Map<string, number>();
for (const page of report) {
  for (const type of page.jsonLdTypes) {
    typeTotals.set(type, (typeTotals.get(type) ?? 0) + 1);
  }
}

console.log("=== 構造化データ / 本文 / description 検査（out/） ===");
console.log(`sitemap URL数: ${sitemapUrls.length}`);
console.log(
  `JSON-LD あり: ${report.length - missing.length}/${report.length}`,
);
console.log(
  `JSON-LD パース失敗: ${parseFailures.length} ページ / ${report.reduce(
    (sum, page) => sum + page.jsonLdBlocks,
    0,
  )} ブロック`,
);
console.log("スキーマ別ページ数:");
for (const [type, count] of [...typeTotals.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${type}: ${count}`);
}
console.log(
  `本文 ${MIN_TEXT}字未満: ${thin.length} ページ / description ${MIN_DESCRIPTION}〜${MAX_DESCRIPTION}字の範囲外: ${shortDescription.length} ページ`,
);
console.log(`noindex のsitemap URL: ${report.length - indexable.length} ページ`);

if (parseFailures.length) {
  for (const page of parseFailures) {
    for (const error of page.jsonLdErrors) console.error(`  ! ${error}`);
  }
}
if (missing.length) {
  for (const page of missing) console.error(`  ! JSON-LD なし: ${page.url}`);
}
if (thin.length) {
  for (const page of thin) {
    console.error(`  ! 薄い(${page.textLength}字): ${page.url}`);
  }
}
if (shortDescription.length) {
  for (const page of shortDescription) {
    console.error(
      `  ! description ${page.descriptionLength}字: ${page.url}`,
    );
  }
}

if (
  parseFailures.length ||
  missing.length ||
  thin.length ||
  shortDescription.length
) {
  fail("sitemap掲載ページの品質基準を満たしていません");
}
console.log("OK: sitemap全URLにJSON-LDがあり、パースでき、本文と description も基準以上");
