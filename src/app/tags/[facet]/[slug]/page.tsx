import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buildTagId } from "@/lib/slug";
import {
  getAllTags,
  getFacet,
  getJobsWithTag,
  getTag,
} from "@/lib/data";
import { RARITY_LABEL } from "@/lib/labels";
import type { FacetId } from "@/types";

export function generateStaticParams() {
  return getAllTags().map((tag) => ({ facet: tag.facet, slug: tag.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ facet: string; slug: string }>;
}): Promise<Metadata> {
  const { facet, slug } = await params;
  const tag = getTag(buildTagId(facet as FacetId, slug));
  if (!tag) return {};
  return {
    title: `${tag.labelJa}／仕事`,
    description: tag.criteriaJa,
    alternates: { canonical: `/tags/${tag.facet}/${tag.slug}` },
  };
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ facet: string; slug: string }>;
}) {
  const { facet: facetId, slug } = await params;
  const tag = getTag(buildTagId(facetId as FacetId, slug));
  if (!tag) notFound();

  const facet = getFacet(tag.facet);
  const jobs = getJobsWithTag(tag.id);
  const replacement = tag.replacedBy ? getTag(tag.replacedBy) : undefined;

  return (
    <div>
      <p className="text-sm text-[var(--muted)]">
        <Link
          href={`/facets/${tag.facet}`}
          className="hover:text-[var(--accent)]"
          style={{ color: `var(--facet-${tag.facet})` }}
        >
          {facet?.emoji} {facet?.labelJa}
        </Link>
      </p>
      <h1 className="mt-2 text-3xl font-bold">{tag.labelJa}</h1>

      {/* 廃止タグでもURLは生かしておく（外部リンクを死なせない）。 */}
      {tag.status === "deprecated" && replacement && (
        <p className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3 text-sm">
          このタグは使われなくなりました。今は{" "}
          <Link
            href={`/tags/${replacement.facet}/${replacement.slug}`}
            className="font-semibold text-[var(--accent)] underline"
          >
            {replacement.labelJa}
          </Link>{" "}
          を使っています。
        </p>
      )}

      <p className="mt-3 text-sm text-[var(--muted)]">
        このタグを付ける基準: {tag.criteriaJa}
      </p>

      {tag.aliasesJa && tag.aliasesJa.length > 0 && (
        <p className="mt-1 text-sm text-[var(--muted)]">
          別の言い方: {tag.aliasesJa.join(" / ")}
        </p>
      )}

      <h2 className="mt-8 text-xl font-bold">この要素を持つ仕事（{jobs.length}件）</h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {jobs.map((job) => (
          <li key={job.slug}>
            <Link
              href={`/jobs/${job.slug}`}
              className="block h-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors hover:border-[var(--accent)]"
            >
              <div className="flex items-baseline gap-2">
                <span aria-hidden="true" className="text-xl">
                  {job.emoji}
                </span>
                <span className="font-semibold">{job.nameJa}</span>
              </div>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {job.summaryJa}
              </p>
              <p className="mt-2 text-xs text-[var(--muted)]">
                {RARITY_LABEL[job.rarity]}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
