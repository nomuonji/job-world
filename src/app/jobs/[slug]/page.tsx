import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
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
  const commonSearchAlias = job.aliasesJa.find(
    (alias) => alias === "ひよこ鑑定士" || alias === "眼鏡作製技能士",
  );
  const seoName = commonSearchAlias ? `${job.nameJa}（${commonSearchAlias}）` : job.nameJa;
  return {
    title: `${seoName}とは｜仕事内容・なり方ガイド`,
    description: `${job.summaryJa} ${job.surpriseJa}`.slice(0, 120),
    alternates: { canonical: `/jobs/${job.slug}` },
    openGraph: {
      type: "article",
      title: `${seoName}とは｜仕事内容・なり方ガイド`,
      description: job.summaryJa,
      images: [
        { url: `/og/${job.slug}.png`, width: 1200, height: 630, alt: job.nameJa },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: "@shikaku_catalog",
      creator: "@shikaku_catalog",
      title: `${seoName}とは｜仕事内容・なり方ガイド`,
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
  // A real two-hop trail, derived from the published graph. Not a fabricated career ladder.
  const twoHopTrails = neighbors.flatMap(first => {
    const next = getNeighborEntry(first.slug)?.neighbors.find(second =>
      second.slug !== job.slug && second.slug !== first.slug &&
      (getJobBySlug(second.slug)?.rarity ?? 0) >= 4
    );
    const via = getJobBySlug(first.slug);
    const destination = next && getJobBySlug(next.slug);
    return via && next && destination
      ? [{ via, destination, firstReason: first.reasonJa, secondReason: next.reasonJa }]
      : [];
  }).filter((trail,index,array) =>
    array.findIndex(other => other.destination.slug === trail.destination.slug) === index
  ).slice(0,3);

  const egoCenter = toEgoCenter(job);
  const egoNodes = toEgoNodes(entry);
  const fromCandidates = egoNodes.map((n) => ({
    slug: n.slug,
    nameJa: n.nameJa,
    emoji: n.emoji,
  }));

  return (
    <article className="occupation-sheet">
      <nav className="atlas-breadcrumb" aria-label="パンくずリスト">
        <Link href="/">図鑑の地図</Link><span>／</span><Link href="/jobs">職業一覧</Link><span>／</span><span>{job.nameJa}</span>
      </nav>
      <header className="occupation-cover atlas-illustrated-cover">
        <div className="atlas-profile-heading">
          <span>FIELD RECORD / {job.slug.toUpperCase().replace(/-/g," ")}</span>
          <span>しごと図鑑の収録記録</span>
        </div>
        <div className="atlas-cover-art"><Image src={`/og/${job.slug}.png`} alt={`${job.nameJa}の図鑑用イラスト・見出し画像`} width={1200} height={630} priority sizes="(max-width: 850px) 100vw, 550px"/></div>
        <div className="atlas-cover-copy">
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
        </div>
        <nav className="atlas-profile-tabs" aria-label="この職業の内容">
          <a href="#occupation-story">仕事の内容 ↓</a>
          <a href="#neighbors">隣にある仕事 ↓</a>
          <a href="#occupation-facets">仕事の共通点 ↓</a>
          <a href="#occupation-sources">参考資料 ↓</a>
        </nav>
      </header>

      {twoHopTrails.length > 0 && (
        <section className="atlas-route-panel" aria-labelledby="next-two-hops">
          <div className="atlas-route-intro">
            <span>EXPLORATION / 2 STEPS</span>
            <h2 id="next-two-hops">この仕事から、もう二歩。</h2>
            <p>同じ業界の仕事とは限りません。図鑑に記録されたつながりを二つ続けてみると、別の仕事に出会えます。</p>
          </div>
          <ol className="atlas-route-grid">
            {twoHopTrails.map((trail,index) => (
              <li key={trail.destination.slug} className="atlas-route">
                <span className="atlas-route-id">ROUTE {String(index+1).padStart(2,"0")}</span>
                <div><span className="atlas-route-number">いま</span><strong>{job.emoji} {job.nameJa}</strong></div>
                <div><span className="atlas-route-number">1歩目</span><Link href={`/jobs/${trail.via.slug}?from=${job.slug}`}>{trail.via.emoji} {trail.via.nameJa} ↗</Link><small>{trail.firstReason}</small></div>
                <div><span className="atlas-route-number">2歩目</span><Link href={`/jobs/${trail.destination.slug}?from=${trail.via.slug}`}>{trail.destination.emoji} {trail.destination.nameJa} ↗</Link><small>{trail.secondReason}</small></div>
              </li>
            ))}
          </ol>
          <p className="atlas-route-disclaimer">この経路は図鑑内のタグと関連づけに基づく探索例で、転職の順番や職業間の優劣を示すものではありません。</p>
        </section>
      )}

      <div className="atlas-profile-story" id="occupation-story">
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
          <div className="mt-3 whitespace-pre-line">{job.howToBecomeJa}</div>
        </section>
      )}

      </div>
      <section className="mt-10 atlas-network-section" id="neighbors">
        <h2 className="text-xl font-bold">ここから辿れる仕事</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          タグの重なりから自動で導き出した、隣にある仕事。
          方向が同じものは、同じ角度でつながっています。
        </p>

        <EgoNetwork center={egoCenter} nodes={egoNodes} facets={getFacets()} />

        <Suspense fallback={null}>
          <FromNote candidates={fromCandidates} />
        </Suspense>

        <NeighborList fromSlug={job.slug} neighbors={neighbors.slice(0, 14)} />
      </section>

      <section className="mt-10 atlas-profile-facets" id="occupation-facets">
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
        <section className="mt-10 text-sm text-[var(--muted)] atlas-profile-sources" id="occupation-sources">
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
