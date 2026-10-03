import type { Metadata } from "next";
import Link from "next/link";
import { getAllJobs } from "@/lib/data";
import { RARITY_LABEL } from "@/lib/labels";

export const metadata: Metadata = {
  title: "珍しい仕事・珍しい職業一覧｜知らなかった仕事を探す",
  description:
    "しごと図鑑の150職業から、珍度4〜5に分類した珍しい仕事・珍しい職業を一覧で紹介。伝統職、専門職、特殊な現場の仕事など、普通に暮らしていると出会いにくい仕事を探せます。",
  alternates: { canonical: "/rare-jobs" },
};

export default function RareJobsPage() {
  const jobs = getAllJobs();
  const veryRare = jobs
    .filter((job) => job.rarity === 5)
    .sort((a, b) => a.nameJa.localeCompare(b.nameJa, "ja"));
  const rare = jobs
    .filter((job) => job.rarity === 4)
    .sort((a, b) => a.nameJa.localeCompare(b.nameJa, "ja"));
  const listed = [...veryRare, ...rare];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "珍しい仕事・珍しい職業一覧",
    numberOfItems: listed.length,
    itemListElement: listed.map((job, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: job.nameJa,
      url: `https://job.antonbase.com/jobs/${job.slug}`,
    })),
  };

  const renderJobs = (items: typeof jobs) => (
    <ul className="mt-4 grid gap-3 sm:grid-cols-2">
      {items.map((job) => (
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
            <p className="mt-1 text-sm text-[var(--muted)]">{job.summaryJa}</p>
            <p className="mt-2 text-xs text-[var(--muted)]">
              図鑑内の珍度: {RARITY_LABEL[job.rarity]}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <p className="text-sm font-semibold text-[var(--accent)]">RARE OCCUPATIONS</p>
      <h1 className="mt-1 text-3xl font-bold">珍しい仕事・珍しい職業</h1>
      <p className="mt-3 max-w-2xl text-[var(--muted)]">
        普通に暮らしていると名前を知る機会が少ない仕事を、
        しごと図鑑の150職業から集めました。求人の多さや年収ではなく、
        「その仕事に就く人の少なさ」を見るための編集上の珍度を使っています。
      </p>

      <aside className="mt-5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-4 text-sm text-[var(--muted)]">
        <strong className="text-[var(--foreground)]">珍度について</strong>
        <p className="mt-1">
          珍度は、各職業を探索しやすくするための編集分類です。
          「全国で数十人・数百人」という表示は分類基準の目安であり、
          全職業について同じ年・同じ統計で実人数を比較したランキングではありません。
          人数や制度に関する具体的な記述は各職業ページの出典を確認してください。
        </p>
      </aside>

      <div className="mt-5 flex flex-wrap gap-3 text-sm">
        <Link
          href="/jobs"
          className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 font-semibold hover:border-[var(--accent)]"
        >
          150の職業一覧を見る
        </Link>
        <Link
          href="/facets"
          className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 font-semibold hover:border-[var(--accent)]"
        >
          7つの角度から探す
        </Link>
      </div>

      <section className="mt-10">
        <h2 className="text-2xl font-bold">特に珍しい仕事</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          図鑑内で珍度5に分類している{veryRare.length}件。
        </p>
        {renderJobs(veryRare)}
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold">珍しい仕事</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          図鑑内で珍度4に分類している{rare.length}件。
        </p>
        {renderJobs(rare)}
      </section>
    </div>
  );
}
