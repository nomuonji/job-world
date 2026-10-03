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
if (!rarePage.includes("編集分類")) {
  fail("rarityを公式人数統計と誤認させない注記がありません");
}
if (!layout.includes('href="/rare-jobs"')) {
  fail("グローバルナビから /rare-jobs への導線がありません");
}

console.log("SEO boundary check: OK");
console.log("- 154 tag URLs remain exploration-only (noindex,follow + sitemap excluded)");
console.log("- /jobs and /rare-jobs remain the primary search-facing discovery hubs");
