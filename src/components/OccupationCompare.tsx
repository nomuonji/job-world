"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export type CompareRecord = {
  slug: string; name: string; emoji: string; summary: string;
  surprise: string; tags: string[]; rarity: number; familiarity: number;
};
export type CompareFacet = { id: string; label: string; question: string; tags: { id: string; label: string }[] };

export function OccupationCompare({ jobs, facets, initialA, initialB }: { jobs: CompareRecord[]; facets: CompareFacet[]; initialA?: string; initialB?: string }) {
  const [left, setLeft] = useState(jobs.some(j => j.slug === initialA) ? initialA! : jobs[0]?.slug ?? "");
  const [right, setRight] = useState(jobs.some(j => j.slug === initialB && j.slug !== initialA) ? initialB! : jobs[1]?.slug ?? "");
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const a = params.get("a");
    const b = params.get("b");
    if(a && b && a !== b && jobs.some(j=>j.slug===a) && jobs.some(j=>j.slug===b)){setLeft(a);setRight(b);}
  },[jobs]);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string>("all");
  const a = jobs.find(j => j.slug === left);
  const b = jobs.find(j => j.slug === right);
  const matches = useMemo(() => jobs.filter(j => (j.name + j.summary).includes(query)).slice(0, 18), [jobs, query]);
  const groups = facets.map(f => {
    const shared = f.tags.filter(t => a?.tags.includes(t.id) && b?.tags.includes(t.id));
    const onlyA = f.tags.filter(t => a?.tags.includes(t.id) && !b?.tags.includes(t.id));
    const onlyB = f.tags.filter(t => b?.tags.includes(t.id) && !a?.tags.includes(t.id));
    return { ...f, shared, onlyA, onlyB };
  }).filter(g => active === "all" || g.id === active);
  const sharedCount = facets.reduce((n, f) => n + f.tags.filter(t => a?.tags.includes(t.id) && b?.tags.includes(t.id)).length, 0);
  const swap = () => { setLeft(right); setRight(left); };
  return <div className="compare-lab">
    <div className="compare-picker">
      <div className="compare-search"><label htmlFor="compare-query">職業を検索して入れ替える</label><input id="compare-query" type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="例：編集者、潜水士、調香師" /></div>
      {query && <div className="compare-results" aria-label="職業検索結果">{matches.length ? matches.map(j => <div key={j.slug}><span>{j.emoji} {j.name}</span><button onClick={() => {setLeft(j.slug);setQuery("");}} disabled={j.slug===right}>左に置く</button><button onClick={() => {setRight(j.slug);setQuery("");}} disabled={j.slug===left}>右に置く</button></div>) : <p>該当する職業がありません。</p>}</div>}
      <div className="compare-controls"><label>仕事 A<select aria-label="左の仕事" value={left} onChange={e => setLeft(e.target.value)}>{jobs.map(j => <option key={j.slug} value={j.slug} disabled={j.slug === right}>{j.name}</option>)}</select></label><button className="compare-swap" onClick={swap} aria-label="左右の職業を交換">⇄ 入れ替え</button><label>仕事 B<select aria-label="右の仕事" value={right} onChange={e => setRight(e.target.value)}>{jobs.map(j => <option key={j.slug} value={j.slug} disabled={j.slug === left}>{j.name}</option>)}</select></label></div>
    </div>
    {a && b && <>
      <div className="compare-heads">
        {[a,b].map((j,i) => <article key={j.slug} className={"compare-head compare-head-"+i}><span className="compare-serial">FIELD RECORD / 0{i+1}</span><div className="compare-face" aria-hidden="true">{j.emoji}</div><h2>{j.name}</h2><p>{j.summary}</p><Link href={`/jobs/${j.slug}`}>仕事の詳細を見る ↗</Link></article>)}
      </div>
      <div className="compare-readout" aria-live="polite"><span>DISCOVERY / 交差点</span><strong>{sharedCount}</strong><p>共通する特徴の数。<br/>相性・転職可能性・年収の比較ではありません。</p></div>
      <div className="compare-filter" aria-label="比較する角度"><button aria-pressed={active==="all"} onClick={()=>setActive("all")}>すべて</button>{facets.map(f=><button key={f.id} aria-pressed={active===f.id} onClick={()=>setActive(f.id)}>{f.label}</button>)}</div>
      <div className="compare-matrix">
        {groups.map(g=><section key={g.id} className="compare-axis" style={{"--axis-color":`var(--facet-${g.id})`} as React.CSSProperties}>
          <header><span>{g.label}</span><h3>{g.question}</h3></header>
          <div className="compare-contrast">
            <div><span className="compare-cell-label">A にだけある</span>{g.onlyA.length ? g.onlyA.map(t=><span className="compare-chip" key={t.id}>{t.label}</span>) : <small>該当なし</small>}</div>
            <div className="compare-common"><span className="compare-cell-label">両方にある</span>{g.shared.length ? g.shared.map(t=><strong className="compare-chip" key={t.id}>{t.label}</strong>) : <small>この角度には共通タグがありません</small>}</div>
            <div><span className="compare-cell-label">B にだけある</span>{g.onlyB.length ? g.onlyB.map(t=><span className="compare-chip" key={t.id}>{t.label}</span>) : <small>該当なし</small>}</div>
          </div>
        </section>)}
      </div>
      <div className="compare-revelation"><span>THINGS YOU DID NOT EXPECT</span><div><article><h3>{a.name}で意外なこと</h3><p>{a.surprise}</p></article><article><h3>{b.name}で意外なこと</h3><p>{b.surprise}</p></article></div></div>
      <p className="compare-note">比較は編集部が付与した分類タグの重なりを示します。タグがないことは、その特徴が絶対にないことを意味しません。珍しさ・知名度も統計的な順位ではありません。実際の仕事内容や就業条件は各職業ページの出典をご確認ください。</p>
    </>}
  </div>;
}
