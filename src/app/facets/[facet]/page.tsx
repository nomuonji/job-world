import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FACET_IDS, type Facet, type FacetId } from "@/types";
import { JsonLd } from "@/components/JsonLd";
import { pageGraph } from "@/lib/schema";
import {
  getAllJobs,
  getFacet,
  getFacets,
  getJobsWithFacet,
  getJobsWithTag,
  getTagsByFacet,
} from "@/lib/data";

export function generateStaticParams() {
  return FACET_IDS.map((facet) => ({ facet }));
}

/**
 * ファセットページの description。
 * タグ数と件数を入れるので、ページごとに文が変わり、他の軸と重複しない。
 */
function facetDescription(
  facet: Facet,
  tagCount: number,
  jobCount: number,
  total: number,
): string {
  const coverage =
    jobCount === total
      ? `${total}職業のすべてに、この角度のタグが付いています。`
      : `${total}職業のうち${jobCount}件に、この角度のタグが付いています。`;
  return `${facet.questionJa}という角度から、しごと図鑑の${total}職業を並べ替えて見るページです。${facet.labelJa}のタグ${tagCount}個と、それぞれのタグが付いた仕事の例を件数付きで一覧できます。${coverage}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ facet: string }>;
}): Promise<Metadata> {
  const { facet: id } = await params;
  const facet = getFacet(id);
  if (!facet) return {};
  const tagCount = getTagsByFacet(facet.id as FacetId).length;
  const jobCount = getJobsWithFacet(facet.id as FacetId).length;
  return {
    title: `${facet.labelJa}でつながる`,
    description: facetDescription(facet, tagCount, jobCount, getAllJobs().length),
    alternates: { canonical: `/facets/${facet.id}` },
  };
}

export default async function FacetPage({
  params,
}: {
  params: Promise<{ facet: string }>;
}) {
  const { facet: id } = await params;
  const facet = getFacet(id);
  if (!facet) notFound();

  const tags = getTagsByFacet(facet.id as FacetId);
  const jobs = getAllJobs();
  const jobsInFacet = getJobsWithFacet(facet.id as FacetId);
  const otherFacets = getFacets().filter((item) => item.id !== facet.id);
  const top = tags[0];
  const bottom = tags[tags.length - 1];
  const tagSum = tags.reduce((sum, tag) => sum + tag.df, 0);
  // 1職業あたり、この角度のタグをいくつ持っているか。
  const perJob =
    Math.round((tagSum / Math.max(jobsInFacet.length, 1)) * 10) / 10;
  const coverage =
    jobsInFacet.length === jobs.length
      ? `収録している${jobs.length}職業のすべてに、この角度のタグが付いています。1職業あたり平均${perJob}個です。`
      : `収録している${jobs.length}職業のうち${jobsInFacet.length}件に、この角度のタグが付いています。1職業あたり平均${perJob}個です。`;
  // この軸のタグを多く持つ仕事。「この角度が濃く出ている仕事」の実測値。
  const tagIdsInFacet = new Set(tags.map((tag) => tag.id));
  const heaviest = [...jobs]
    .map((job) => ({
      job,
      count: job.tags.filter((tagId) => tagIdsInFacet.has(tagId)).length,
    }))
    .filter((entry) => entry.count > 0)
    .sort(
      (a, b) =>
        b.count - a.count || a.job.kanaJa.localeCompare(b.job.kanaJa, "ja"),
    )
    .slice(0, 6);

  const title = `${facet.labelJa}でつながる`;
  const description = facetDescription(
    facet,
    tags.length,
    jobsInFacet.length,
    jobs.length,
  );

  const structuredData = pageGraph({
    path: `/facets/${facet.id}`,
    name: title,
    description,
    type: "CollectionPage",
    trail: [
      { name: "しごと図鑑", path: "" },
      { name: "7つの角度", path: "/facets" },
      { name: facet.labelJa, path: `/facets/${facet.id}` },
    ],
  });

  return (
    <div>
      <JsonLd data={structuredData} />
      <p className="text-sm text-[var(--muted)]">
        <Link href="/facets" className="hover:text-[var(--accent)]">
          7つの角度
        </Link>
      </p>
      <h1
        className="mt-2 text-3xl font-bold"
        style={{ color: `var(--facet-${facet.id})` }}
      >
        {facet.emoji} {facet.labelJa}
      </h1>
      <p className="mt-2 text-[var(--muted)]">{facet.questionJa}</p>

      <section className="mt-8" aria-labelledby="facet-spread">
        <h2 id="facet-spread" className="text-xl font-bold">
          この角度の広がり
        </h2>
        <p className="mt-2 max-w-2xl">
          {facet.labelJa}は{tags.length}個のタグに分かれています。
          {coverage}
          いちばん多く付いているのは「{top.labelJa}」（{top.df}件）、いちばん少ないのは「
          {bottom.labelJa}」（{bottom.df}
          件）です。件数はタグの定義に沿って数えた図鑑内の実測値で、職業の優劣や人数を示すものではありません。
        </p>
      </section>

      <section className="mt-10" aria-labelledby="facet-tags">
        <h2 id="facet-tags" className="text-xl font-bold">
          タグと、そのタグが付いた仕事
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
          タグごとに、その要素を持つ仕事を3件まで例として挙げています。仕事名から職業ページへ移れます。
        </p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {tags.map((tag) => {
            const examples = getJobsWithTag(tag.id).slice(0, 3);
            return (
              <li key={tag.id}>
                <div className="h-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <Link
                      href={`/tags/${tag.facet}/${tag.slug}`}
                      className="font-semibold hover:text-[var(--accent)]"
                    >
                      {tag.labelJa}
                    </Link>
                    <span className="shrink-0 text-sm text-[var(--muted)]">
                      {tag.df} 件
                    </span>
                  </div>
                  {examples.length > 0 && (
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      例:{" "}
                      {examples.map((job, index) => (
                        <span key={job.slug}>
                          {index > 0 && "、"}
                          <Link
                            href={`/jobs/${job.slug}`}
                            className="underline hover:text-[var(--accent)]"
                          >
                            {job.nameJa}
                          </Link>
                        </span>
                      ))}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-10" aria-labelledby="facet-heavy">
        <h2 id="facet-heavy" className="text-xl font-bold">
          この角度のタグが多い仕事
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
          {facet.labelJa}のタグを多く持つ順に6件を挙げます。同じ仕事でも、別の角度から見ると順番は変わります。
        </p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {heaviest.map(({ job, count }) => (
            <li key={job.slug}>
              <Link
                href={`/jobs/${job.slug}`}
                className="block h-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 transition-colors hover:border-[var(--accent)]"
              >
                <span className="font-semibold">
                  <span aria-hidden="true">{job.emoji}</span> {job.nameJa}
                </span>
                <span className="ml-2 text-xs text-[var(--muted)]">
                  {facet.labelJa}のタグ {count} 個
                </span>
                <span className="mt-1 block text-sm text-[var(--muted)]">
                  {job.summaryJa}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10" aria-labelledby="facet-others">
        <h2 id="facet-others" className="text-xl font-bold">
          ほかの角度から見る
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
          同じ仕事でも、どの角度で見るかによって隣に来る仕事が変わります。6つの角度から選び直せます。
        </p>
        <ul className="mt-4 flex flex-wrap gap-2 text-sm">
          {otherFacets.map((other) => (
            <li key={other.id}>
              <Link
                href={`/facets/${other.id}`}
                className="inline-block rounded-full border border-[var(--border)] px-3 py-1.5 hover:border-[var(--accent)]"
              >
                {other.emoji} {other.labelJa}
                <span className="text-[var(--muted)]">（{other.questionJa}）</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
