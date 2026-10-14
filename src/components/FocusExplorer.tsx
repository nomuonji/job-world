"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import type { WorldNodeView } from "@/lib/view";

/** Readable relationship explorer: select one job, reveal only its immediate links. */
export function FocusExplorer({nodes}:{nodes:WorldNodeView[]}) {
 const [selected,setSelected]=useState(nodes.find(n=>n.familiarity>=4)?.slug??nodes[0]?.slug??"");
 const [query,setQuery]=useState("");
 const bySlug=useMemo(()=>new Map(nodes.map(n=>[n.slug,n])),[nodes]);
 const current=bySlug.get(selected);
 const matches=nodes.filter(n=>(n.nameJa+" "+n.summaryJa).toLocaleLowerCase("ja").includes(query.toLocaleLowerCase("ja"))).slice(0,12);
 return <div className="focus-explorer">
  <div className="focus-explorer-controls">
    <div><span className="focus-eyebrow">PICK ONE / 仕事をひとつ選ぶ</span><label htmlFor="focus-job-search">気になる職業を探す</label><input id="focus-job-search" type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="職業名・仕事内容を入力"/></div>
    <label className="focus-select-label" htmlFor="focus-job-select">150職業から選ぶ<select id="focus-job-select" value={selected} onChange={e=>{setSelected(e.target.value);setQuery("");}}>{nodes.map(n=><option key={n.slug} value={n.slug}>{n.nameJa}</option>)}</select></label>
    {query&&<div className="focus-search-results" aria-label="検索結果">{matches.length?matches.map(n=><button key={n.slug} type="button" onClick={()=>{setSelected(n.slug);setQuery("");}}>{n.emoji} {n.nameJa}<span>選ぶ ↗</span></button>):<p>見つかりませんでした。別の言葉で探してください。</p>}</div>}
  </div>
  {current&&<div className="focus-explorer-body">
    <div className="focus-center"><span className="focus-eyebrow">YOUR STARTING POINT</span><span className="focus-center-emoji" aria-hidden="true">{current.emoji}</span><h3>{current.nameJa}</h3><p>{current.summaryJa}</p><Link href={`/jobs/${current.slug}`}>この仕事を詳しく見る ↗</Link></div>
    <div className="focus-neighbors"><div className="focus-neighbors-heading"><span className="focus-eyebrow">CONNECTED WORK</span><h3>似ているところから、次の仕事へ。</h3><p>線だらけの全体図ではなく、この職業につながる仕事だけを表示します。カードを選ぶと起点が切り替わります。</p></div>
     <div className="focus-neighbor-list">{current.edges.map((edge,i)=>{const n=bySlug.get(edge.slug);return n?<button type="button" key={edge.slug} onClick={()=>setSelected(n.slug)} className="focus-neighbor"><span className="focus-neighbor-index">{String(i+1).padStart(2,"0")}</span><span className="focus-neighbor-icon" aria-hidden="true">{n.emoji}</span><span className="focus-neighbor-copy"><strong>{n.nameJa}</strong><small>{edge.sharedLabelJa? `共通点：${edge.sharedLabelJa}`:edge.reasonJa}</small></span><span aria-hidden="true" className="focus-neighbor-arrow">→</span></button>:null})}</div>
    </div>
  </div>}
  <p className="focus-explorer-footnote">つながりは収録データの特徴分類に基づくもので、転職可能性や職業の優劣を示すものではありません。<Link href="/jobs">全職業の索引を見る ↗</Link></p>
 </div>;
}
