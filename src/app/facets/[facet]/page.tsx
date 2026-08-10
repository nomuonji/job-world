import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FACET_IDS, type FacetId } from "@/types";
import { getFacet, getTagsByFacet } from "@/lib/data";

export function generateStaticParams() {
  return FACET_IDS.map((facet) => ({ facet }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ facet: string }>;
}): Promise<Metadata> {
  const { facet: id } = await params;
  const facet = getFacet(id);
  if (!facet) return {};
  return {
    title: `${facet.labelJa}でつながる`,
    description: `${facet.questionJa}という角度から仕事を見る。`,
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

  return (
    <div>
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

      <ul className="mt-8 grid gap-2 sm:grid-cols-2">
        {tags.map((tag) => (
          <li key={tag.id}>
            <Link
              href={`/tags/${tag.facet}/${tag.slug}`}
              className="flex items-baseline justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 transition-colors hover:border-[var(--accent)]"
            >
              <span className="font-semibold">{tag.labelJa}</span>
              <span className="shrink-0 text-sm text-[var(--muted)]">
                {tag.df} 件
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
