import type { Metadata } from "next";
import {
  getAllJobs,
  getAllTags,
  getFacets,
  getGraphHealth,
  getTagsByFacet,
} from "@/lib/data";

export const metadata: Metadata = {
  title: "この図鑑の状態",
  description: "収録件数、タグの分布、探索のしやすさの実測値。",
  alternates: { canonical: "/stats" },
};

/**
 * 収録状況と、探索が成立しているかの実測値。
 * 読者向けであると同時に、キュレーションの健全性を自分で確認するための画面でもある。
 */
export default function StatsPage() {
  const jobs = getAllJobs();
  const tags = getAllTags();
  const facets = getFacets();
  const health = getGraphHealth();

  const rarity = [1, 2, 3, 4, 5].map(
    (r) => jobs.filter((j) => j.rarity === r).length,
  );
  const familiarity = [1, 2, 3, 4, 5].map(
    (f) => jobs.filter((j) => j.familiarity === f).length,
  );
  const max = Math.max(...rarity, ...familiarity, 1);

  return (
    <div>
      <h1 className="text-3xl font-bold">この図鑑の状態</h1>

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

      <section className="mt-10">
        <h2 className="text-xl font-bold">探索が成立しているか</h2>
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

      <section className="mt-10">
        <h2 className="text-xl font-bold">珍しさの分布</h2>
        <Bars values={rarity} max={max} />
        <h2 className="mt-8 text-xl font-bold">知られ方の分布</h2>
        <Bars values={familiarity} max={max} />
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold">角度ごとのタグ数</h2>
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
    </div>
  );
}

function Bars({ values, max }: { values: number[]; max: number }) {
  return (
    <ul className="mt-3 space-y-1.5">
      {values.map((count, i) => (
        <li key={i} className="flex items-center gap-3 text-sm">
          <span className="w-8 shrink-0 text-[var(--muted)]">{i + 1}</span>
          <span
            className="h-3 rounded-full bg-[var(--accent)]"
            style={{ width: `${(count / max) * 100}%`, minWidth: count ? 6 : 0 }}
          />
          <span className="text-[var(--muted)]">{count}</span>
        </li>
      ))}
    </ul>
  );
}
