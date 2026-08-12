import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAllJobs,
  getFacets,
  getGraphHealth,
  getJobBySlug,
  getJobTagsByFacet,
  getNeighborEntry,
} from "@/lib/data";
import { toEgoCenter, toEgoNodes } from "@/lib/view";
import { NeighborList } from "@/components/NeighborList";
import { EgoNetwork } from "@/components/EgoNetwork";
import { FromNote } from "@/components/FromNote";
import { Trail } from "@/components/Trail";
import { RARITY_LABEL, FAMILIARITY_LABEL } from "@/lib/labels";
import { shikakuLinkForJob } from "@/lib/shikaku";

export function generateStaticParams() {
  return getAllJobs().map((job) => ({ slug: job.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const job = getJobBySlug(slug);
  if (!job) return {};
  return {
    title: job.nameJa,
    description: `${job.summaryJa} ${job.surpriseJa}`.slice(0, 120),
    alternates: { canonical: `/jobs/${job.slug}` },
    openGraph: {
      type: "article",
      title: job.nameJa,
      description: job.summaryJa,
      images: [
        { url: `/og/${job.slug}.png`, width: 1200, height: 630, alt: job.nameJa },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: job.nameJa,
      description: job.summaryJa,
      images: [`/og/${job.slug}.png`],
    },
  };
}

export default async function JobPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const job = getJobBySlug(slug);
  if (!job) notFound();

  const entry = getNeighborEntry(job.slug);
  const neighbors = entry?.neighbors ?? [];
  const tagGroups = getJobTagsByFacet(job);
  const health = getGraphHealth();
  const isEntry = health.entrySlugs.includes(job.slug);
  const shikaku = shikakuLinkForJob(job);

  // クライアントへ渡すのは表示用の最小データだけ（全職業の本文を送らない）。
  const egoCenter = toEgoCenter(job);
  const egoNodes = toEgoNodes(entry);
  // ?from= の解決に必要な分。相互性が保証されているので、
  // ここに来られる職業は必ず隣人プールに含まれている。
  const fromCandidates = egoNodes.map((n) => ({
    slug: n.slug,
    nameJa: n.nameJa,
    emoji: n.emoji,
  }));

  return (
    <article>
      <header>
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="text-5xl">
            {job.emoji}
          </span>
          <div>
            <h1 className="text-3xl font-bold">{job.nameJa}</h1>
            <p className="text-sm text-[var(--muted)]">
              {job.kanaJa}
              {job.nameEn && ` / ${job.nameEn}`}
            </p>
          </div>
        </div>

        <p className="mt-4 text-lg">{job.summaryJa}</p>

        <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-[var(--muted)]">
          <div className="flex gap-2">
            <dt>珍しさ</dt>
            <dd className="text-[var(--foreground)]">
              {RARITY_LABEL[job.rarity]}
            </dd>
          </div>
          <div className="flex gap-2">
            <dt>知られ方</dt>
            <dd className="text-[var(--foreground)]">
              {FAMILIARITY_LABEL[job.familiarity]}
            </dd>
          </div>
          {isEntry && (
            <div className="text-[var(--accent)]">探索の入口になる仕事</div>
          )}
        </dl>

        {job.aliasesJa.length > 0 && (
          <p className="mt-2 text-sm text-[var(--muted)]">
            別名: {job.aliasesJa.join(" / ")}
          </p>
        )}
      </header>

      {/* 意外な一点。この図鑑の価値の中心なので、本文より先に出す。 */}
      <section className="mt-8 rounded-lg border-l-4 border-[var(--accent)] bg-[var(--surface)] p-5">
        <h2 className="text-sm font-bold text-[var(--accent)]">
          知られていないこと
        </h2>
        <p className="mt-2">{job.surpriseJa}</p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-bold">どんな仕事か</h2>
        <p className="mt-3">{job.descriptionJa}</p>
        {job.aDayJa && <p className="mt-3">{job.aDayJa}</p>}
      </section>

      {job.howToBecomeJa && (
        <section className="mt-8">
          <h2 className="text-xl font-bold">どうやってなるか</h2>
          <p className="mt-3">{job.howToBecomeJa}</p>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-xl font-bold">ここから辿れる仕事</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          タグの重なりから自動で導き出した、隣にある仕事。
          方向が同じものは、同じ角度でつながっています。
        </p>

        {/* 図はサーバー側で描かれる（EgoNetwork は useSearchParams を使わない）。 */}
        <EgoNetwork center={egoCenter} nodes={egoNodes} facets={getFacets()} />

        {/* FromNote は useSearchParams を使うので、こちらだけ Suspense に包む。 */}
        <Suspense fallback={null}>
          <FromNote candidates={fromCandidates} />
        </Suspense>

        <NeighborList fromSlug={job.slug} neighbors={neighbors.slice(0, 14)} />
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold">この仕事を作っている要素</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {tagGroups.map(({ facet, tags }) => (
            <div key={facet.id}>
              <h3
                className="text-sm font-bold"
                style={{ color: `var(--facet-${facet.id})` }}
              >
                {facet.emoji} {facet.labelJa}
              </h3>
              <ul className="mt-1 flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <li key={tag.id}>
                    <Link
                      href={`/tags/${tag.facet}/${tag.slug}`}
                      className="inline-block rounded-full border border-[var(--border)] px-2.5 py-0.5 text-sm hover:border-[var(--accent)] hover:text-[var(--accent)]"
                    >
                      {tag.labelJa}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {job.sources && job.sources.length > 0 && (
        <section className="mt-10 text-sm text-[var(--muted)]">
          <h2 className="font-bold">参考にしたもの</h2>
          <ul className="mt-2 space-y-1">
            {job.sources.map((source) => (
              <li key={source.url}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-[var(--accent)]"
                >
                  {source.titleJa}
                </a>
                {source.publisherJa && `（${source.publisherJa}）`}
              </li>
            ))}
          </ul>
          <p className="mt-3">最終更新: {job.updatedAt}</p>
        </section>
      )}

      {/* 資格カタログへの導線。資格と仕事を行き来できるようにする。 */}
      <section className="mt-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="text-sm font-bold text-[var(--accent)]">
          🎓 この仕事の資格・試験を調べる
        </h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          資格カタログ（shikaku.antonbase.com）で、この仕事に活きる資格の
          難易度・合格率・勉強法を調べられます。
        </p>
        <a
          href={shikaku.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block rounded-full border border-[var(--border)] px-4 py-2 text-sm font-bold hover:border-[var(--accent)] hover:text-[var(--accent)]"
        >
          資格カタログ「{shikaku.label}」で調べる →
        </a>
      </section>

      <Trail current={egoCenter} />
    </article>
  );
}
