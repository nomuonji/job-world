import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { itemListNode, pageGraph } from "@/lib/schema";
import {
  getFacets,
  getJobsWithFacet,
  getTagCountStats,
  getTagsByFacet,
} from "@/lib/data";

export const metadata: Metadata = {
  title: "7つの角度",
  description:
    "仕事を舞台・扱うもの・動作・感覚・働き方・気質・業界の7つの軸で分けています。どの軸で見るかによって、隣に来る仕事が変わります。各角度のタグ数と、その軸のタグが付いた仕事の件数も一覧できます。",
  alternates: { canonical: "/facets" },
};

const PAGE_TITLE = "7つの角度";
const PAGE_DESCRIPTION =
  "仕事を舞台・扱うもの・動作・感覚・働き方・気質・業界の7つの軸で分けています。どの軸で見るかによって、隣に来る仕事が変わります。各角度のタグ数と、その軸のタグが付いた仕事の件数も一覧できます。";

export default function FacetsPage() {
  const facets = getFacets();
  const tagStats = getTagCountStats();
  const rows = facets.map((facet) => {
    const tags = getTagsByFacet(facet.id);
    const jobCount = getJobsWithFacet(facet.id).length;
    const tagSum = tags.reduce((sum, tag) => sum + tag.df, 0);
    return {
      facet,
      tags,
      jobCount,
      // 1職業あたり、この角度のタグをいくつ持っているか。
      perJob: Math.round((tagSum / Math.max(jobCount, 1)) * 10) / 10,
      top: tags[0],
    };
  });
  const maxTags = Math.max(...rows.map((row) => row.tags.length));

  const structuredData = pageGraph({
    path: "/facets",
    name: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    type: "CollectionPage",
    trail: [
      { name: "しごと図鑑", path: "" },
      { name: "7つの角度", path: "/facets" },
    ],
    itemList: itemListNode({
      path: "/facets",
      name: "7つの角度",
      items: facets.map((facet) => ({
        name: facet.labelJa,
        path: `/facets/${facet.id}`,
      })),
    }),
  });

  return (
    <div>
      <JsonLd data={structuredData} />
      <h1 className="text-3xl font-bold">7つの角度</h1>
      <p className="mt-3 max-w-2xl text-[var(--muted)]">
        この図鑑では、仕事に付けるタグを7つの軸に分けています。軸を分けているのは、
        「同じ業界の仕事」ではなく「業界は違うが同じ体の使い方をする仕事」を
        取り出せるようにするためです。同じ仕事も、どの軸で見るかによって隣に来る仕事が変わります。
      </p>

      <section className="mt-10" aria-labelledby="facet-spread">
        <h2 id="facet-spread" className="text-xl font-bold">
          角度ごとの広がり
        </h2>
        <p className="mt-2 max-w-2xl">
          7つの角度は、それぞれ別の問いに答えています。「{rows[0].facet.questionJa}
          」を分ける{rows[0].facet.labelJa}は{rows[0].tags.length}
          個のタグに分かれ、1職業あたり平均{rows[0].perJob}
          個のタグが付いています。いちばん細かく分かれているのは
          {rows.reduce((a, b) => (a.tags.length >= b.tags.length ? a : b)).facet.labelJa}
          で
          {maxTags}
          個、いちばん少ないのは
          {rows.reduce((a, b) => (a.tags.length <= b.tags.length ? a : b)).facet.labelJa}
          で
          {rows.reduce((a, b) => (a.tags.length <= b.tags.length ? a : b)).tags.length}
          個です。タグの数が多い軸ほど、同じ仕事でも隣に来る相手が細かく変わります。
        </p>
        <table className="mt-4 w-full border-collapse text-left text-sm">
          <caption className="sr-only">
            角度ごとのタグ数と、1職業あたりに付いているタグの数
          </caption>
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th scope="col" className="py-2 pr-4 font-semibold">
                角度
              </th>
              <th scope="col" className="py-2 pr-4 font-semibold">
                問い
              </th>
              <th scope="col" className="py-2 pr-4 font-semibold">
                タグ
              </th>
              <th scope="col" className="py-2 pr-4 font-semibold">
                1職業あたり
              </th>
              <th scope="col" className="py-2 font-semibold">
                最も多いタグ
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ facet, tags, perJob, top }) => (
              <tr key={facet.id} className="border-b border-[var(--border)]">
                <th scope="row" className="py-2 pr-4 font-semibold">
                  <Link
                    href={`/facets/${facet.id}`}
                    className="underline"
                    style={{ color: `var(--facet-${facet.id})` }}
                  >
                    {facet.emoji} {facet.labelJa}
                  </Link>
                </th>
                <td className="py-2 pr-4 text-[var(--muted)]">
                  {facet.questionJa}
                </td>
                <td className="py-2 pr-4">{tags.length}</td>
                <td className="py-2 pr-4">{perJob} 個</td>
                <td className="py-2">
                  {top ? `${top.labelJa}（${top.df}件）` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-10" aria-labelledby="facet-combination">
        <h2 id="facet-combination" className="text-xl font-bold">
          1つの仕事は、いくつの角度でできているか
        </h2>
        <p className="mt-2 max-w-2xl">
          収録している職業は、1件あたり平均
          {tagStats.average}
          個のタグを持っています（最少{tagStats.min}個、最多{tagStats.max}
          個）。どの仕事も複数の角度にまたがっているので、
          「扱うもの」で見つけた仕事を「動作」で見直すと、まったく別の隣人が現れます。
          角度を切り替えることが、この図鑑の使い方そのものです。
        </p>
        <p className="mt-3 text-sm">
          実測値の一覧は
          <Link href="/stats" className="underline">
            この図鑑の状態
          </Link>
          に、角度をまたいだ探し方は
          <Link href="/jobs" className="underline">
            職業一覧
          </Link>
          にまとめています。
        </p>
      </section>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {rows.map(({ facet, tags, jobCount }) => (
          <li key={facet.id}>
            <Link
              href={`/facets/${facet.id}`}
              className="block h-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 transition-colors hover:border-[var(--accent)]"
            >
              <h2
                className="text-lg font-bold"
                style={{ color: `var(--facet-${facet.id})` }}
              >
                {facet.emoji} {facet.labelJa}
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {facet.questionJa}
              </p>
              <p className="mt-3 text-sm">
                {tags
                  .slice(0, 6)
                  .map((t) => t.labelJa)
                  .join(" ・ ")}
                {tags.length > 6 && " ほか"}
              </p>
              <p className="mt-2 text-xs text-[var(--muted)]">
                {tags.length} 個のタグ / {jobCount} 件の仕事
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
