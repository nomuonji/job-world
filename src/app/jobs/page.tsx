import type { Metadata } from "next";
import Link from "next/link";
import { AtlasIndex } from "@/components/AtlasIndex";
import { getAllJobs, getTagsInDefinitionOrder } from "@/lib/data";

export const metadata: Metadata = {
  title: "職業一覧｜150の仕事・職業の種類を図鑑で探す",
  description:
    "しごと図鑑に収録した150の仕事・職業を一覧で紹介。仕事内容の一言要約から、知っている仕事も珍しい仕事も辿って探せます。",
  alternates: { canonical: "/jobs" },
};

export default function JobsPage() {
  const jobs = getAllJobs();
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "職業一覧",
    numberOfItems: jobs.length,
    itemListElement: jobs.map((job, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: job.nameJa,
      url: `https://job.antonbase.com/jobs/${job.slug}`,
    })),
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <section className="atlas-index-cover"><span>INDEX / {jobs.length} OCCUPATIONS</span><p className="text-sm font-semibold">職業名が分かっている人はこちらから。</p>
      <h1 className="mt-1 text-3xl font-bold">職業一覧・仕事の種類</h1>
      <p className="mt-3 max-w-2xl text-[var(--muted)]">
        この図鑑に収録している{jobs.length}件の仕事を一覧で見られます。
        求人を並べるのではなく、仕事内容の違いや意外なつながりから
        「名前を知らなかった仕事」を見つけるための一覧です。
      </p>
      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <Link
          href="/rare-jobs"
          className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 font-semibold hover:border-[var(--accent)]"
        >
          珍しい仕事から探す
        </Link>
        <Link
          href="/facets"
          className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 font-semibold hover:border-[var(--accent)]"
        >
          7つの角度から探す
        </Link>
      </div>
      </section>
      <AtlasIndex jobs={jobs.map(j=>({slug:j.slug,name:j.nameJa,summary:j.summaryJa,emoji:j.emoji,industry:j.tags.find(t=>t.startsWith("industry."))??"industry.other",rarity:j.rarity,familiarity:j.familiarity}))} industries={getTagsInDefinitionOrder("industry").map(t=>({id:t.id,name:t.labelJa}))} />
    </div>
  );
}
