import type { Metadata } from "next";
import Link from "next/link";
import { AtlasIndex } from "@/components/AtlasIndex";
import { JsonLd } from "@/components/JsonLd";
import { itemListNode, pageGraph } from "@/lib/schema";
import { getAllJobs, getTagsInDefinitionOrder } from "@/lib/data";

export const metadata: Metadata = {
  title: "職業一覧｜150の仕事・職業の種類を図鑑で探す",
  description:
    "しごと図鑑に収録した150の仕事・職業を一覧で紹介。仕事内容の一言要約から、知っている仕事も珍しい仕事も辿って探せます。業界や珍しさで絞り込み、気になる仕事から隣の仕事へ移れます。",
  alternates: { canonical: "/jobs" },
};

export default function JobsPage() {
  const jobs = getAllJobs();
  const itemList = itemListNode({
    path: "/jobs",
    name: "職業一覧",
    items: jobs.map((job) => ({
      name: job.nameJa,
      path: `/jobs/${job.slug}`,
    })),
  });
  const structuredData = pageGraph({
    path: "/jobs",
    name: "職業一覧｜150の仕事・職業の種類を図鑑で探す",
    description:
      "しごと図鑑に収録した150の仕事・職業を一覧で紹介。仕事内容の一言要約から、知っている仕事も珍しい仕事も辿って探せます。業界や珍しさで絞り込み、気になる仕事から隣の仕事へ移れます。",
    type: "CollectionPage",
    trail: [
      { name: "しごと図鑑", path: "" },
      { name: "職業一覧", path: "/jobs" },
    ],
    itemList,
  });

  return (
    <div>
      <JsonLd data={structuredData} />
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
      <section aria-labelledby="guided-exploration" className="my-8 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 id="guided-exploration" className="text-xl font-bold">仕事内容だけでなく、違い・なり方まで調べる</h2>
        <p className="mt-2 text-[var(--muted)]">職業を横断したガイド。似た仕事の境界、同じ現場の分担、実際の進路を調べられます。</p>
        <ul className="mt-3 grid gap-2 md:grid-cols-3">
          <li><Link className="underline" href="/guides/airport-jobs">空港で働く仕事の種類 ↗</Link></li>
          <li><Link className="underline" href="/guides/traditional-crafts">伝統工芸の職人になるには ↗</Link></li>
          <li><Link className="underline" href="/guides/ground-handling-vs-maintenance">整備士とグラハンの違い ↗</Link></li>
          <li><Link className="underline" href="/guides/space-jobs">宇宙に関わる仕事 ↗</Link></li>
        </ul>
      </section>
      <AtlasIndex jobs={jobs.map(j=>({slug:j.slug,name:j.nameJa,summary:j.summaryJa,emoji:j.emoji,industry:j.tags.find(t=>t.startsWith("industry."))??"industry.other",rarity:j.rarity,familiarity:j.familiarity}))} industries={getTagsInDefinitionOrder("industry").map(t=>({id:t.id,name:t.labelJa}))} />
    </div>
  );
}
