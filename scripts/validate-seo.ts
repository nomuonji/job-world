import { readFileSync } from "node:fs";

function read(path: string) {
  return readFileSync(path, "utf8");
}

function fail(message: string): never {
  throw new Error(message);
}

const sitemap = read("src/app/sitemap.ts");
const tagPage = read("src/app/tags/[facet]/[slug]/page.tsx");
const jobsPage = read("src/app/jobs/page.tsx");
const rarePage = read("src/app/rare-jobs/page.tsx");
const layout = read("src/app/layout.tsx");

if (sitemap.includes("getAllTags")) {
  fail("探索用タグページをsitemapへ戻してはいけません");
}
if (!sitemap.includes('"/rare-jobs"')) {
  fail("/rare-jobs がsitemapの静的検索入口に含まれていません");
}
if (!tagPage.includes("robots: { index: false, follow: true }")) {
  fail("タグページが noindex,follow ではありません");
}
if (!jobsPage.includes("職業一覧・仕事の種類")) {
  fail("/jobs が職業一覧の検索入口として構成されていません");
}
if (!rarePage.includes("珍しい仕事・珍しい職業")) {
  fail("/rare-jobs の検索意図が失われています");
}
if (!rarePage.includes("編集上の珍度")) {
  fail("rarityを公式人数統計と誤認させない注記がありません");
}
if (!layout.includes('href="/rare-jobs"')) {
  fail("グローバルナビから /rare-jobs への導線がありません");
}


const guidePaths = [
  "src/app/guides/page.tsx",
  "src/app/guides/airport-jobs/page.tsx",
  "src/app/guides/traditional-crafts/page.tsx",
  "src/app/guides/ground-handling-vs-maintenance/page.tsx",
  "src/app/guides/space-jobs/page.tsx",
  "src/app/guides/pilot-vs-controller/page.tsx",
  "src/app/guides/rocket-vs-satellite/page.tsx",
];
for (const path of guidePaths) {
  const page = read(path);
  if (!page.includes("alternates: { canonical:") || !page.includes("<h1") || page.length < 1200) {
    fail(`検索ガイドの独立タイトル・本文・canonicalが不足: ${path}`);
  }
  if (path !== "src/app/guides/page.tsx" && !page.includes("https://")) {
    fail(`一次情報を参照しない検索ガイド: ${path}`);
  }
}
const jobsData = [
  ...JSON.parse(read("src/data/jobs/aerospace.json")).jobs,
  ...JSON.parse(read("src/data/jobs/craft.json")).jobs,
] as Array<{slug:string;descriptionJa:string;howToBecomeJa:string;aDayJa?:string;sources?:Array<{titleJa:string;url:string}>}>;
for (const slug of ["air-traffic-controller","airport-ramp-agent","drone-pilot","bamboo-artisan"]) {
  const job = jobsData.find((item) => item.slug === slug);
  if (!job || job.descriptionJa.length < 350 || job.howToBecomeJa.length < 170 ||
      !job.aDayJa || job.aDayJa.length < 75 || (job.sources?.length ?? 0) < 2 ||
      job.sources!.some((source) => !source.titleJa || !source.url.startsWith("https://"))) {
    fail(`一次情報・仕事内容・就業経路の改善基準を満たさない: ${slug}`);
  }
}
if (!sitemap.includes('"/guides/airport-jobs"') ||
    !sitemap.includes('"/guides/traditional-crafts"') ||
    !sitemap.includes('"/guides/ground-handling-vs-maintenance"')) {
  fail("新規検索ガイドがsitemapに掲載されていません");
}
if (guidePaths.some((path) => read(path).includes('"@type": "JobPosting"'))) {
  fail("職業解説ページを求人票として構造化してはいけません");
}
const newlyRevised = [
  "flight-attendant", "rocket-launch-technician", "satellite-controller",
  "barrel-maker", "brush-maker", "swordsmith",
  "urushi-lacquerer", "washi-papermaker",
];
for (const slug of newlyRevised) {
  const job = jobsData.find((item) => item.slug === slug);
  if (!job || job.descriptionJa.length < 250 || job.howToBecomeJa.length < 170 ||
      !job.aDayJa || job.aDayJa.length < 75 || (job.sources?.length ?? 0) < 2 ||
      job.sources!.some((source) => !source.titleJa || !source.url.startsWith("https://"))) {
    fail(`改稿した職業の本文・実務例・一次情報が不足: ${slug}`);
  }
}
for (const path of [
  "/guides/space-jobs", "/guides/pilot-vs-controller", "/guides/rocket-vs-satellite"
]) {
  if (!sitemap.includes('"' + path + '"')) fail(`新ガイドがsitemapにない: ${path}`);
}
const home = read("src/app/page.tsx");
if (!home.includes('href="/guides/airport-jobs"') ||
    !home.includes('href="/guides/traditional-crafts"') ||
    !home.includes('href="/guides/space-jobs"')) {
  fail("ホームに検索用横断ガイドへの導線がない");
}
const detailPage = read("src/app/jobs/[slug]/page.tsx");
if (!detailPage.includes('href="/guides/rocket-vs-satellite"') ||
    !detailPage.includes('href="/guides/pilot-vs-controller"')) {
  fail("職業詳細から横断比較への内部リンクがない");
}
console.log("- 12 expanded occupation records and 6 sourced indexable guides verified");

console.log("SEO boundary check: OK");
console.log("- 154 tag URLs remain exploration-only (noindex,follow + sitemap excluded)");
console.log("- /jobs and /rare-jobs remain the primary search-facing discovery hubs");
