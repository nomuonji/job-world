import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { pageGraph } from "@/lib/schema";
import {
  getAllJobs,
  getAllTags,
  getFacets,
  getGraphHealth,
  getTagCountStats,
  getTagsByFacet,
} from "@/lib/data";
import {
  FAMILIARITY_LABEL,
  LIFECYCLE_LABEL,
  RARITY_LABEL,
} from "@/lib/labels";
import type { Lifecycle } from "@/types";

export const metadata: Metadata = {
  title: "この図鑑の状態",
  description:
    "しごと図鑑に収録した150職業・154タグ・7つの角度の実測値。珍しさと知られ方の分布、入口から辿り着ける割合、角度ごとのタグ数を数字で確認できます。収録の内訳と探索の検査結果も掲載しています。",
  alternates: { canonical: "/stats" },
};

const LIFECYCLE_ORDER: Lifecycle[] = [
  "traditional",
  "established",
  "emerging",
  "declining",
];

/**
 * 収録状況と、探索が成立しているかの実測値。
 * 読者向けであると同時に、キュレーションの健全性を自分で確認するための画面でもある。
 */
export default function StatsPage() {
  const jobs = getAllJobs();
  const tags = getAllTags();
  const facets = getFacets();
  const health = getGraphHealth();
  const tagStats = getTagCountStats();

  const rarity = [1, 2, 3, 4, 5].map(
    (r) => jobs.filter((j) => j.rarity === r).length,
  );
  const familiarity = [1, 2, 3, 4, 5].map(
    (f) => jobs.filter((j) => j.familiarity === f).length,
  );
  const max = Math.max(...rarity, ...familiarity, 1);

  const lifecycle = LIFECYCLE_ORDER.map((key) => ({
    key,
    label: LIFECYCLE_LABEL[key],
    count: jobs.filter((job) => job.lifecycle === key).length,
  }));
  const withSources = jobs.filter((job) => (job.sources?.length ?? 0) > 0).length;
  const withADay = jobs.filter((job) => !!job.aDayJa).length;
  const withHowTo = jobs.filter((job) => !!job.howToBecomeJa).length;
  const rarest = jobs.filter((job) => job.rarity === 5).slice(0, 5);
  const unseen = jobs.filter((job) => job.familiarity === 1).slice(0, 5);

  const title = "この図鑑の状態";
  const description =
    "しごと図鑑に収録した150職業・154タグ・7つの角度の実測値。珍しさと知られ方の分布、入口から辿り着ける割合、角度ごとのタグ数を数字で確認できます。収録の内訳と探索の検査結果も掲載しています。";

  const structuredData = pageGraph({
    path: "/stats",
    name: title,
    description,
    trail: [
      { name: "しごと図鑑", path: "" },
      { name: "この図鑑の状態", path: "/stats" },
    ],
  });

  return (
    <div>
      <JsonLd data={structuredData} />
      <h1 className="text-3xl font-bold">この図鑑の状態</h1>
      <p className="mt-3 max-w-2xl text-[var(--muted)]">
        収録件数と、探索が成立しているかを毎回の更新で機械的に測った結果です。
        数字はこの図鑑の内部で数えたもので、仕事に就いている人の人数や求人の数を示す統計ではありません。
      </p>

      <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "仕事", value: jobs.length },
          { label: "タグ", value: tags.length },
          { label: "角度", value: facets.length },
          { label: "平均のつながり", value: health.averageDegree },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4"
          >
            <dt className="text-sm text-[var(--muted)]">{item.label}</dt>
            <dd className="text-2xl font-bold">{item.value}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-10" aria-labelledby="how-to-count">
        <h2 id="how-to-count" className="text-xl font-bold">
          数字の数え方
        </h2>
        <p className="mt-2 max-w-2xl">
          「珍しさ」は従事している人の少なさを5段階に、「知られ方」は名前の広まりを5段階に分けた編集上の目安です。
          たとえば珍しさ5は「{RARITY_LABEL[5]}」、知られ方1は「{FAMILIARITY_LABEL[1]}」という言い方に置き換えています。
          どちらも同じ年・同じ統計で全職業を並べた順位ではなく、探索の手がかりとして付けた分類です。
          「平均のつながり」は、各職業から上位8件の隣人を数えたときの平均次数です。
        </p>
      </section>

      <section className="mt-10" aria-labelledby="collection-mix">
        <h2 id="collection-mix" className="text-xl font-bold">
          収録の内訳
        </h2>
        <p className="mt-2 max-w-2xl">
          {jobs.length}職業のうち、出典を1件以上挙げているものは{withSources}
          件、「1日の例」を書いているものは{withADay}件、「どうやってなるか」を書いているものは
          {withHowTo}件です。時代の中での位置づけは、次のように分けています。
        </p>
        <ul className="mt-4 flex flex-wrap gap-2 text-sm">
          {lifecycle.map((item) => (
            <li
              key={item.key}
              className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5"
            >
              {item.label} <strong>{item.count}</strong> 件
            </li>
          ))}
        </ul>
        <p className="mt-3 max-w-2xl text-sm text-[var(--muted)]">
          位置づけも編集上の分類です。増えている・減っているは、仕事の価値の上下を意味しません。
        </p>
      </section>

      <section className="mt-10" aria-labelledby="tag-density">
        <h2 id="tag-density" className="text-xl font-bold">
          タグの付き方
        </h2>
        <p className="mt-2 max-w-2xl">
          1職業あたりのタグは平均{tagStats.average}個（最少{tagStats.min}
          個、最多{tagStats.max}
          個）。7つの角度のうち、どの角度のタグが何個あるかは
          <Link href="/facets" className="underline">
            7つの角度
          </Link>
          に、1職業ごとのタグは各職業ページの「この仕事を作っている要素」に載せています。
          タグの総数は{tags.length}個で、うち業界のタグが
          {getTagsByFacet("industry").length}個です。
        </p>
      </section>

      <section className="mt-10" aria-labelledby="exploration-health">
        <h2 id="exploration-health" className="text-xl font-bold">
          探索が成立しているか
        </h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          「知っている仕事から辿って、全部にたどり着けるか」を毎回の更新で機械的に確かめています。
        </p>
        <ul className="mt-4 space-y-2 text-sm">
          <li className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
            入口になる仕事（名前を知っている人が多いもの）: {health.entrySlugs.length} 件
          </li>
          <li className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
            入口から辿り着ける仕事の割合:{" "}
            <strong>{(health.reachabilityRatio * 100).toFixed(1)}%</strong>
          </li>
          <li className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
            どこからも辿り着けない仕事: <strong>{health.orphanSlugs.length} 件</strong>
          </li>
          <li className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
            入口から珍しい仕事までの平均: <strong>{health.averageHopsToRare} 歩</strong>
          </li>
        </ul>
      </section>

      <section className="mt-10" aria-labelledby="rarity-distribution">
        <h2 id="rarity-distribution" className="text-xl font-bold">
          珍しさの分布
        </h2>
        <Bars values={rarity} max={max} labels={RARITY_LABEL} />
        <h2 className="mt-8 text-xl font-bold">知られ方の分布</h2>
        <Bars values={familiarity} max={max} labels={FAMILIARITY_LABEL} />
      </section>

      <section className="mt-10" aria-labelledby="distribution-examples">
        <h2 id="distribution-examples" className="text-xl font-bold">
          分布の端にある仕事
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
          珍しさ5（{RARITY_LABEL[5]}）と、知られ方1（{FAMILIARITY_LABEL[1]}）に分類している仕事の例です。
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {[
            { heading: `珍しさ5の例（${rarest.length}件を表示）`, items: rarest },
            { heading: `知られ方1の例（${unseen.length}件を表示）`, items: unseen },
          ].map((group) => (
            <div key={group.heading}>
              <h3 className="text-sm font-bold">{group.heading}</h3>
              <ul className="mt-2 space-y-1 text-sm">
                {group.items.map((job) => (
                  <li key={job.slug}>
                    <Link href={`/jobs/${job.slug}`} className="underline">
                      {job.emoji} {job.nameJa}
                    </Link>
                    <span className="text-[var(--muted)]"> — {job.summaryJa}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10" aria-labelledby="facet-tag-counts">
        <h2 id="facet-tag-counts" className="text-xl font-bold">
          角度ごとのタグ数
        </h2>
        <ul className="mt-4 space-y-2">
          {facets.map((facet) => {
            const count = getTagsByFacet(facet.id).length;
            return (
              <li key={facet.id} className="flex items-center gap-3 text-sm">
                <span className="w-28 shrink-0">
                  {facet.emoji} {facet.labelJa}
                </span>
                <span
                  className="h-3 rounded-full"
                  style={{
                    backgroundColor: `var(--facet-${facet.id})`,
                    width: `${(count / tags.length) * 100 * 3}%`,
                  }}
                />
                <span className="text-[var(--muted)]">{count}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <p className="mt-10 text-sm">
        <Link href="/about" className="underline">
          この図鑑について
        </Link>
        ／
        <Link href="/jobs" className="underline">
          職業一覧
        </Link>
      </p>
    </div>
  );
}

function Bars({
  values,
  max,
  labels,
}: {
  values: number[];
  max: number;
  labels: Record<number, string>;
}) {
  return (
    <ul className="mt-3 space-y-1.5">
      {values.map((count, i) => (
        <li key={i} className="flex items-center gap-3 text-sm">
          <span className="w-8 shrink-0 text-[var(--muted)]">{i + 1}</span>
          <span
            className="h-3 rounded-full bg-[var(--accent)]"
            style={{ width: `${(count / max) * 100}%`, minWidth: count ? 6 : 0 }}
          />
          <span className="shrink-0 text-[var(--muted)]">
            {count} 件（{labels[i + 1]}）
          </span>
        </li>
      ))}
    </ul>
  );
}
