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
import { RandomJump } from "@/components/RandomJump";
import { WorldMap } from "@/components/WorldMap";
import { SITE_URL } from "./layout";

export const metadata: Metadata = {
  alternates: { canonical: SITE_URL },
  openGraph: { url: SITE_URL },
};

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
    <div className="explorer-atlas-home">
      <section className="explorer-cover" aria-labelledby="explorer-cover-title">
        <div className="explorer-cover-copy">
          <span className="explorer-overline">OCCUPATION ATLAS / {jobs.length} FIELD RECORDS</span>
          <h1 id="explorer-cover-title">その仕事を<br />知らないまま、<br /><em>生きていた。</em></h1>
          <p>知っている仕事をひとつ選ぶ。似た動作、使う道具、働く場所をたどっていく。そこには、名前さえ知らなかった仕事がある。</p>
          <nav aria-label="探索を開始">
            <a href="#world-map" className="explorer-cover-primary">仕事の地図を触る <span>↓</span></a>
            <Link href="/jobs" className="explorer-cover-secondary">職業を名前から探す ↗</Link>
          </nav>
        </div>
        <div className="explorer-cover-orbit" aria-hidden="true">
          <div className="explorer-orbit-shell"><i className="orbit-1"></i><i className="orbit-2"></i><i className="orbit-3"></i><i className="orbit-4"></i><span className="explorer-orbit-center">?</span><span className="explorer-orbit-note">NEXT<br />OCCUPATION</span></div>
          <p>同じ業界じゃなくても、仕事はつながる。</p>
        </div>
        <div className="explorer-cover-bottom"><span>仕事に詳しい必要はありません。</span><span>{jobs.length} occupations / 7 connections</span></div>
      </section>

      <section className="explorer-map-station" id="world-map" aria-labelledby="world-map-heading">
        <header className="explorer-section-head">
          <span>01 / 地図から探索する</span>
          <h2 id="world-map-heading">仕事の地図。</h2>
          <p>ひとつの点を選ぶと、周囲の仕事が現れます。業界は方角、知られ方は中心からの距離。線は選んだ仕事からだけ伸びます。</p>
        </header>
        <div className="explorer-map-layout">
          <aside className="explorer-map-instructions">
            <span>HOW TO EXPLORE</span>
            <ol>
              <li><strong>01</strong><span>見覚えのある職業をひとつ選ぶ。</span></li>
              <li><strong>02</strong><span>選んだ仕事のまわりに現れるつながりを見る。</span></li>
              <li><strong>03</strong><span>気になった隣の仕事へ移る。</span></li>
            </ol>
            <p>地図の操作が難しければ、下の職業一覧から始められます。</p>
            <RandomJump slugs={jobs.map(j=>j.slug)} />
            <Link href="/jobs" className="explorer-text-link">全職業の索引を見る ↗</Link>
          </aside>
          <div className="explorer-map-canvas">
            <WorldMap nodes={worldNodes} industryOrder={industryOrder} industryLabels={industryLabels}/>
          </div>
        </div>
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
