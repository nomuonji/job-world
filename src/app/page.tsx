import type { Metadata } from "next";
import Link from "next/link";
import {
  getAllJobs,
  getEntryJobs,
  getFacets,
  getRareJobs,
  getTagsInDefinitionOrder,
} from "@/lib/data";
import { toWorldNodes } from "@/lib/view";
import { WorldAtlas } from "@/components/WorldAtlas";
import { JsonLd } from "@/components/JsonLd";
import { homeGraph } from "@/lib/schema";
import { SITE_URL } from "./layout";

// ページ側で openGraph を指定すると layout の openGraph は置き換わる（deep merge されない）。
// そのため images を書かないとトップだけ og:image が消える（2026-10-27 に実測）。
export const metadata: Metadata = {
  alternates: { canonical: SITE_URL },
  openGraph: {
    url: SITE_URL,
    images: [{ url: "/og/default.png", width: 1200, height: 630 }],
  },
};

export default function Home() {
  const jobs = getAllJobs();
  const entries = getEntryJobs(8);
  const rare = getRareJobs(6);
  const facets = getFacets();

  // 全体マップ用。業界タグの定義順が、そのまま地図の方角になる。
  const worldNodes = toWorldNodes(jobs);
  const industries = getTagsInDefinitionOrder("industry");

  return (
    <div className="explorer-atlas-home">
      <JsonLd data={homeGraph()} />
      <section className="atlas-relaunch-cover" aria-labelledby="explorer-cover-title">
        <div className="atlas-relaunch-topline">
          <span>SHIGOTO ATLAS — EXPLORING WORK</span>
          <span>{jobs.length} OCCUPATIONS / 7 CONNECTIONS</span>
        </div>
        <div className="atlas-relaunch-inner">
          <div>
            <p className="atlas-relaunch-eyebrow">仕事の名前を超えて、その先へ。</p>
            <h1 id="explorer-cover-title">知っている仕事から、<br /><em>知らない世界へ。</em></h1>
            <p className="atlas-relaunch-description">この世界には、まだ名前も知らない仕事がある。150の職業をつないだ地図を歩いて、思いがけない仕事に出会おう。</p>
            <div className="atlas-relaunch-actions">
              <a href="#world-map" className="atlas-relaunch-primary">仕事の地図を歩く <span aria-hidden="true">↓</span></a>
              <Link href="/jobs">名前から探す ↗</Link>
              <Link href="/compare">二つの仕事を比べる ↗</Link>
            </div>
          </div>
          <div className="atlas-relaunch-aside">
            <div><strong>150</strong><span>収録している職業</span></div>
            <p>同じ業界にいる仕事だけが、似ているとは限らない。使う感覚、動作、扱うもの。つながりの理由が見える地図です。</p>
            <span className="atlas-relaunch-aside-line">SCROLL TO DISCOVER ↓</span>
          </div>
        </div>
      </section>

      <section className="atlas-relaunch-map-section" id="world-map" aria-labelledby="world-map-heading">
        <header className="atlas-relaunch-map-heading">
          <div><span>THE ATLAS / EXPLORE THE WORLD</span><h2 id="world-map-heading">仕事の地図。</h2></div>
          <p>まず、選んだ仕事と似ている6つの仕事を見比べてください。名前と共通点がその場で読めます。「全体地図」に切り替えると150職業の位置関係も探索できます。</p>
        </header>
        <WorldAtlas
          nodes={worldNodes}
          industryOrder={industries.map((industry) => industry.id)}
          industryLabels={industries.map((industry) => [industry.id, industry.labelJa] as [string, string])}
        />
        <nav className="atlas-relaunch-routes" aria-label="仕事の探し方">
          <Link href="/jobs"><strong>職業を一覧から探す</strong><span>収録している全職業を検索・絞り込み ↗</span></Link>
          <Link href="/compare"><strong>仕事を二つ比較する</strong><span>似ているところと違うところを読み解く ↗</span></Link>
          <Link href="/rare-jobs"><strong>珍しい仕事に出会う</strong><span>ふだん見かけない仕事をもっと知る ↗</span></Link>
        </nav>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10" aria-labelledby="guides-entry">
        <h2 id="guides-entry" className="text-2xl font-bold">仕事内容と職業の種類を、疑問から調べる</h2>
        <p className="mt-2 leading-8">150の仕事を辿れる職業図鑑。現場や進路を比べるガイドも用意しています。</p>
        <ul className="mt-4 grid gap-3 md:grid-cols-3">
          <li><Link className="underline" href="/guides/airport-jobs">空港で働く仕事の種類 ↗</Link></li>
          <li><Link className="underline" href="/guides/traditional-crafts">伝統工芸の職人になるには ↗</Link></li>
          <li><Link className="underline" href="/guides/space-jobs">宇宙に関わる仕事 ↗</Link></li>
        </ul>
        <p className="mt-4"><Link href="/guides" className="underline">職業比較ガイド一覧へ →</Link></p>
      </section>
      <section className="explorer-entry-station" aria-labelledby="explorer-entry-title">
        <header className="explorer-section-head">
          <span>02 / 知っている仕事から</span>
          <h2 id="explorer-entry-title">最初の一歩。</h2>
          <p>よく聞く仕事にも、意外な隣人がいます。入り口を選ぶだけで探索が始まります。</p>
        </header>
        <ul className="explorer-entry-grid">
          {entries.map((job,i)=>(
            <li key={job.slug}><Link href={`/jobs/${job.slug}`}><span className="explorer-entry-number">{String(i+1).padStart(2,"0")}</span><span className="explorer-entry-emoji" aria-hidden="true">{job.emoji}</span><strong>{job.nameJa}</strong><span className="explorer-entry-arrow" aria-hidden="true">↗</span></Link></li>
          ))}
        </ul>
      </section>

      <section className="explorer-rare-station" aria-labelledby="explorer-rare-title">
        <div className="explorer-rare-intro">
          <span>03 / 聞いたことのない仕事</span>
          <h2 id="explorer-rare-title">こんな仕事も、<br />地図のどこかに。</h2>
          <p>ここでの「珍しさ」は図鑑の編集上の分類であり、最新の就業人口ランキングではありません。</p>
          <Link href="/rare-jobs">珍しい仕事の索引へ ↗</Link>
        </div>
        <ul className="explorer-rare-list">
          {rare.map((job,i)=>(
            <li key={job.slug}><Link href={`/jobs/${job.slug}`}><span>{String(i+1).padStart(2,"0")}</span><span className="explorer-rare-emoji" aria-hidden="true">{job.emoji}</span><span><strong>{job.nameJa}</strong><small>{job.summaryJa}</small></span><b aria-hidden="true">↗</b></Link></li>
          ))}
        </ul>
      </section>

      <section className="explorer-facet-station" aria-labelledby="explorer-facet-title">
        <header className="explorer-section-head">
          <span>04 / 同じ仕事を、違う角度で</span>
          <h2 id="explorer-facet-title">つながり方は、七つ。</h2>
          <p>「扱うもの」が同じ仕事と「働く場所」が同じ仕事では、まったく違う道が見えてきます。</p>
        </header>
        <ul className="explorer-facet-grid">
          {facets.map((facet,i)=>(
            <li key={facet.id}><Link href={`/facets/${facet.id}`} style={{borderColor:`var(--facet-${facet.id})`}}><span>{String(i+1).padStart(2,"0")}</span><strong style={{color:`var(--facet-${facet.id})`}}>{facet.emoji} {facet.labelJa}</strong><small>このつながりで探す ↗</small></Link></li>
          ))}
        </ul>
      </section>
    </div>
  );
}
