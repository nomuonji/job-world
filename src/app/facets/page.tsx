import type { Metadata } from "next";
import Link from "next/link";
import { getFacets, getTagsByFacet } from "@/lib/data";

export const metadata: Metadata = {
  title: "7つの角度",
  description:
    "仕事を舞台・扱うもの・動作・感覚・働き方・気質・業界の7つの軸で分けています。どの軸で見るかによって、隣に来る仕事が変わります。",
  alternates: { canonical: "/facets" },
};

export default function FacetsPage() {
  const facets = getFacets();

  return (
    <div>
      <h1 className="text-3xl font-bold">7つの角度</h1>
      <p className="mt-3 max-w-2xl text-[var(--muted)]">
        この図鑑では、仕事に付けるタグを7つの軸に分けています。軸を分けているのは、
        「同じ業界の仕事」ではなく「業界は違うが同じ体の使い方をする仕事」を
        取り出せるようにするためです。同じ仕事も、どの軸で見るかによって隣に来る仕事が変わります。
      </p>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {facets.map((facet) => {
          const tags = getTagsByFacet(facet.id);
          return (
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
                  {tags.length} 個のタグ
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
