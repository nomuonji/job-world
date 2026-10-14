import type { Metadata } from "next";
import Link from "next/link";
import { getAllJobs, getFacets, getAllTags } from "@/lib/data";
import { OccupationCompare } from "@/components/OccupationCompare";
import "./compare.css";

export const metadata: Metadata = {
  title: "仕事の比較室｜2つの職業の共通点と違いを発見する",
  description: "二つの職業を7つの視点で比較。働く場所、扱うもの、動作、感覚などから、意外な共通点や違いを発見できるしごと図鑑の比較室。",
  alternates: { canonical: "/compare" },
};

export default function ComparePage() {
 const jobs = getAllJobs();
 const tags = getAllTags();
 const records = jobs.map(j => ({ slug: j.slug, name: j.nameJa, emoji: j.emoji, summary: j.summaryJa, surprise: j.surpriseJa, tags: j.tags, rarity: j.rarity, familiarity: j.familiarity }));
 const facets = getFacets().map(f => ({ id: f.id, label: f.labelJa, question: f.questionJa, tags: tags.filter(t => t.facet === f.id).map(t => ({id:t.id,label:t.labelJa})) }));
 const first = jobs.find(j=>j.familiarity>=4) ?? jobs[0];
 const contrasting = jobs.find(j=>j.slug !== first.slug && j.rarity>=4) ?? jobs[1];
 const ordered = [first, contrasting, ...jobs.filter(j=>j.slug !== first.slug && j.slug !== contrasting.slug)];
 const orderedRecords = ordered.map(j=>records.find(r=>r.slug===j.slug)!);
 return <div className="compare-page"><nav className="atlas-breadcrumb"><Link href="/">しごと図鑑</Link><span>/</span><span>比較室</span></nav><header className="compare-intro"><span>OCCUPATION ATLAS / COMPARISON LAB</span><h1>違う仕事の、<br/><em>同じところ。</em></h1><p>名前が違っても、仕事の中身は似ていることがある。二つの職業を台に載せて、7つの角度から分解してみよう。</p><div className="compare-intro-rail"><span>01 / 仕事を2つ選ぶ</span><span>02 / 共通点を見つける</span><span>03 / 違いを読む</span></div></header><OccupationCompare jobs={orderedRecords} facets={facets}/></div>;
}
