"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
export type AtlasItem={slug:string;name:string;summary:string;emoji:string;industry:string;rarity:number;familiarity:number};
export function AtlasIndex({jobs,industries}:{jobs:AtlasItem[];industries:{id:string;name:string}[]}){
 const [q,setQ]=useState("");const [industry,setIndustry]=useState("all");const [mode,setMode]=useState("all");
 const filtered=useMemo(()=>jobs.filter(j=>(j.name+j.summary).toLocaleLowerCase("ja").includes(q.toLocaleLowerCase("ja"))&&(industry==="all"||j.industry===industry)&&(mode==="all"||(mode==="rare"?j.rarity>=4:j.familiarity>=4))),[jobs,q,industry,mode]);
 return <div className="atlas-browser">
 <div className="atlas-browser-console"><div><span className="atlas-browser-kicker">THE OCCUPATION INDEX / LIVE FILTER</span><h2>仕事を、探査する。</h2><p>名前を知っていても、知らなくても。興味のある世界から絞り込めます。</p></div>
 <div className="atlas-browser-search"><label htmlFor="atlas-query">職業名・仕事内容で探す</label><input id="atlas-query" type="search" value={q} onChange={e=>setQ(e.target.value)} placeholder="何をする仕事？" /></div>
 <div className="atlas-browser-filters"><label>領域<select value={industry} onChange={e=>setIndustry(e.target.value)}><option value="all">すべての領域</option>{industries.map(i=><option key={i.id} value={i.id}>{i.name}</option>)}</select></label><div className="atlas-browser-modes" role="group" aria-label="職業の種類">{[["all","すべて"],["familiar","見覚えがある"],["rare","めずらしい"]].map(([id,label])=><button type="button" aria-pressed={mode===id} onClick={()=>setMode(id)} key={id}>{label}</button>)}</div></div>
 <div className="atlas-browser-count" aria-live="polite"><strong>{filtered.length}</strong><span> / {jobs.length} RECORDS</span><button type="button" onClick={()=>{setQ("");setIndustry("all");setMode("all");}}>絞り込みを解除 ↺</button></div></div>
 {filtered.length===0?<div className="atlas-browser-empty">該当する仕事はありません。条件を変えて探してください。</div>:<ul className="atlas-browser-results">{filtered.map((j,i)=><li key={j.slug}><Link href={`/jobs/${j.slug}`}><div className="atlas-browser-photo"><Image src={`/og/${j.slug}.png`} width={1200} height={630} sizes="(max-width: 600px) 120px, (max-width: 1000px) 35vw, 240px" alt="" loading="lazy"/></div><div className="atlas-browser-copy"><span className="atlas-browser-code">{String(i+1).padStart(3,"0")} / {industries.find(t=>t.id===j.industry)?.name||"その他"}</span><h3><span aria-hidden="true">{j.emoji}</span> {j.name}</h3><p>{j.summary}</p></div><span className="atlas-browser-arrow" aria-hidden="true">↗</span></Link></li>)}</ul>}</div>;
}
