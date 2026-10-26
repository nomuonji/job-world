/**
 * 構造化データ（JSON-LD）の組み立て。
 *
 * 方針:
 *  - 出力する値は、そのページに実際に書かれている事実だけ。給与・労働条件・需要などの
 *    数値は、ページに無いものを補わない（推測を構造化データで固定しない）。
 *  - 1ページ1スクリプト。複数の型を出すときは @graph にまとめる。
 *  - @id は「URL#用途」で固定し、isPartOf / mainEntity / breadcrumb から参照する。
 */
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/app/layout";
import { plainText } from "@/lib/text";
import type { Job } from "@/types";

type JsonLdNode = Record<string, unknown>;

export type Crumb = { name: string; path: string };

const WEBSITE_ID = `${SITE_URL}#website`;
const ORGANIZATION_ID = `${SITE_URL}#organization`;

/** フッター・ヘッダーで実際に案内している公式アカウント。 */
const ORGANIZATION_SAME_AS = [
  "https://x.com/shikaku_catalog",
  "https://www.threads.com/@certifications_catalog",
];

const websiteRef: JsonLdNode = {
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  name: SITE_NAME,
  url: SITE_URL,
};

const organizationRef: JsonLdNode = {
  "@type": "Organization",
  "@id": ORGANIZATION_ID,
  name: SITE_NAME,
  url: SITE_URL,
};

export function websiteNode(): JsonLdNode {
  return {
    ...websiteRef,
    inLanguage: "ja",
    description: SITE_DESCRIPTION,
    publisher: organizationRef,
  };
}

export function organizationNode(): JsonLdNode {
  return {
    ...organizationRef,
    description: SITE_DESCRIPTION,
    image: `${SITE_URL}/og/default.png`,
    sameAs: ORGANIZATION_SAME_AS,
  };
}

export function breadcrumbNode(path: string, trail: Crumb[]): JsonLdNode {
  const url = `${SITE_URL}${path}`;
  return {
    "@type": "BreadcrumbList",
    "@id": `${url}#breadcrumb`,
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: `${SITE_URL}${crumb.path}`,
    })),
  };
}

/** 一覧ページが実際に並べている項目。表示している順序をそのまま使う。 */
export function itemListNode(options: {
  path: string;
  name: string;
  items: { name: string; path: string }[];
}): JsonLdNode {
  const url = `${SITE_URL}${options.path}`;
  return {
    "@type": "ItemList",
    "@id": `${url}#itemlist`,
    name: options.name,
    numberOfItems: options.items.length,
    itemListElement: options.items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: `${SITE_URL}${item.path}`,
    })),
  };
}

/**
 * 一覧・解説ページのグラフ。
 * ページ本体（WebPage / CollectionPage）＋ パンくず ＋ 任意の ItemList ＋ 任意の Organization。
 */
export function pageGraph(options: {
  path: string;
  /** <title> と同じ表記にする。 */
  name: string;
  description: string;
  type?: "WebPage" | "CollectionPage";
  trail?: Crumb[];
  itemList?: JsonLdNode;
  dateModified?: string;
  keywords?: string[];
  /** Organization を独立ノードとして出すページ（/about など）。 */
  withOrganization?: boolean;
}): JsonLdNode {
  const url = `${SITE_URL}${options.path}`;
  const page: JsonLdNode = {
    "@type": options.type ?? "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: options.name,
    description: options.description,
    inLanguage: "ja",
    isPartOf: websiteRef,
    publisher: organizationRef,
  };
  if (options.dateModified) page.dateModified = options.dateModified;
  if (options.keywords?.length) page.keywords = options.keywords.join(", ");
  if (options.trail?.length) page.breadcrumb = { "@id": `${url}#breadcrumb` };
  if (options.itemList) page.mainEntity = { "@id": options.itemList["@id"] };

  const graph: JsonLdNode[] = [page];
  if (options.trail?.length) graph.push(breadcrumbNode(options.path, options.trail));
  if (options.itemList) graph.push(options.itemList);
  if (options.withOrganization) graph.push(organizationNode());

  return { "@context": "https://schema.org", "@graph": graph };
}

/** トップページ。サイト自体と運営主体を出す。 */
export function homeGraph(): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@graph": [websiteNode(), organizationNode()],
  };
}

/**
 * 職業ページ。
 *
 * Occupation には、そのページに書かれている名称・説明・別名・参考資料だけを入れる。
 * estimatedSalary（給与）・occupationLocation・qualifications などは、
 * ページに書かれていない以上、推測で埋めない。
 */
export function jobGraph(
  job: Job,
  options: { title: string; description: string; keywords?: string[] },
): JsonLdNode {
  const url = `${SITE_URL}/jobs/${job.slug}`;

  const occupation: JsonLdNode = {
    "@type": "Occupation",
    "@id": `${url}#occupation`,
    name: job.nameJa,
    description: plainText(job.descriptionJa),
    url,
    mainEntityOfPage: url,
    inLanguage: "ja",
    image: `${SITE_URL}/og/${job.slug}.png`,
  };
  const alternateNames = [job.nameEn, ...job.aliasesJa].filter(
    (name): name is string => !!name && name !== job.nameJa,
  );
  if (alternateNames.length > 0) occupation.alternateName = alternateNames;

  const page: JsonLdNode = {
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: options.title,
    description: options.description,
    inLanguage: "ja",
    isPartOf: websiteRef,
    publisher: organizationRef,
    mainEntity: { "@id": `${url}#occupation` },
    about: { "@id": `${url}#occupation` },
    dateModified: job.updatedAt,
    breadcrumb: { "@id": `${url}#breadcrumb` },
  };
  // ページ末尾の「参考にしたもの」。引用元の所在を示すだけで、内容の裏付け主張はしない。
  if (job.sources?.length) {
    page.citation = job.sources.map((source) => ({
      "@type": "CreativeWork",
      name: source.titleJa,
      url: source.url,
    }));
  }
  if (options.keywords?.length) page.keywords = options.keywords.join(", ");

  return {
    "@context": "https://schema.org",
    "@graph": [
      occupation,
      page,
      breadcrumbNode(`/jobs/${job.slug}`, [
        { name: SITE_NAME, path: "" },
        { name: "職業一覧", path: "/jobs" },
        { name: job.nameJa, path: `/jobs/${job.slug}` },
      ]),
    ],
  };
}
