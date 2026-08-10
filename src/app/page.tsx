import Link from "next/link";
import {
  getAllJobs,
  getEntryJobs,
  getFacets,
  getRareJobs,
  getTagsInDefinitionOrder,
} from "@/lib/data";
import { toWorldNodes } from "@/lib/view";
import { RARITY_LABEL } from "@/lib/labels";
import { RandomJump } from "@/components/RandomJump";
import { WorldMap } from "@/components/WorldMap";

export default function Home() {
  const jobs = getAllJobs();
  const entries = getEntryJobs(8);
  const rare = getRareJobs(6);
  const facets = getFacets();

  // 全体マップ用。業界タグの定義順が、そのまま地図の方角になる。
  const industryTags = getTagsInDefinitionOrder("industry");
  const worldNodes = toWorldNodes(jobs);
  const industryOrder = industryTags.map((t) => t.id);
  const industryLabels = industryTags.map(
    (t) => [t.id, t.labelJa] as [string, string],
  );

  return (
    <div>
      <section className="py-8 text-center">
        <h1 className="text-3xl font-bold sm:text-4xl">
          普通に生きていたら、
          <br className="sm:hidden" />
          出会わない仕事に出会う。
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-[var(--muted)]">
          {jobs.length}
          件の仕事を、舞台・扱うもの・動作・感覚など7つの角度でつなげた図鑑です。
          知っている仕事からタグを辿っていくと、2〜3歩で名前も知らなかった仕事に行き着きます。
        </p>
        <RandomJump slugs={jobs.map((j) => j.slug)} />
      </section>

      {/*
        全体マップ。トップの主役なので最初に置く。
        ページ遷移をしないので、ここで好きなだけ辿ってから記事に入れる。
      */}
      <section className="mt-4">
        <h2 className="text-xl font-bold">仕事の地図</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {jobs.length}件すべてを1枚に置いています。まわりの方角が業界、
          中心から外へ行くほど知られていない仕事です。
        </p>
        <WorldMap
          nodes={worldNodes}
          industryOrder={industryOrder}
          industryLabels={industryLabels}
        />
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold">知っている仕事から始める</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          ここが入口です。どれか一つ選ぶと、隣の仕事が見えます。
        </p>
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {entries.map((job) => (
            <li key={job.slug}>
              <Link
                href={`/jobs/${job.slug}`}
                className="flex h-full flex-col items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 text-center transition-colors hover:border-[var(--accent)]"
              >
                <span aria-hidden="true" className="text-3xl">
                  {job.emoji}
                </span>
                <span className="mt-2 text-sm font-semibold">{job.nameJa}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold">こんな仕事があります</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          全国で数百人、あるいは数十人しかいない仕事。
        </p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {rare.map((job) => (
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
                  <span className="text-xs text-[var(--muted)]">
                    {RARITY_LABEL[job.rarity]}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {job.summaryJa}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold">7つの角度</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          同じ仕事も、どの軸で見るかによって隣に来る仕事が変わります。
        </p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {facets.map((facet) => (
            <li key={facet.id}>
              <Link
                href={`/facets/${facet.id}`}
                className="inline-block rounded-full border border-[var(--border)] px-3 py-1.5 text-sm transition-colors hover:border-[var(--accent)]"
                style={{ color: `var(--facet-${facet.id})` }}
              >
                {facet.emoji} {facet.labelJa}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
