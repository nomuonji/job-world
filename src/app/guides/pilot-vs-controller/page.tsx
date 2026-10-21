import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = {title:"パイロットと航空管制官の違い｜仕事内容・採用・資格",description:"飛行機を操縦するパイロットと、飛行の安全間隔を管理する航空管制官。仕事の境界、必要な訓練、就職までの経路を比較。",alternates:{canonical:"/guides/pilot-vs-controller"}};
const rows=[
["働く場所","航空機の操縦室","空港の管制塔やレーダー管制室など"],
["判断の中心","自機の運航・機体状態・飛行手順","担当する空域内の交通の流れと機体間の安全間隔"],
["連絡の役割","管制官からの指示を確認し、操縦・運航判断に反映","航空機と交信して進路・離着陸順序などを調整"],
["就業の入口","航空会社の自社養成などの採用・訓練、資格を持つ操縦士の採用","人事院の航空管制官採用試験と採用後の研修・技能試験"],
];
export default function PilotVsController(){return <article className="mx-auto max-w-4xl space-y-8 leading-8">
<nav className="text-sm text-[var(--muted)]"><Link href="/guides" className="underline">仕事のガイド</Link> / パイロットと航空管制官</nav>
<header className="space-y-3"><p className="text-sm font-bold text-[var(--accent)]">AIR TRAFFIC / TWO SIDES</p><h1 className="text-3xl font-bold">パイロットと航空管制官は、何が違う？</h1><p>同じ無線交信を通じて一便の安全を支えるが、役割は同じではない。パイロットは機体を操縦し、航空管制官は担当する空域と離着陸の交通を調整する。就職の入口も別々だ。</p></header>
<section className="space-y-3"><h2 className="text-2xl font-bold">仕事と進路を対比する</h2><div className="overflow-x-auto rounded-lg border border-[var(--border)]"><table className="min-w-[650px] w-full border-collapse text-left text-sm"><thead><tr className="bg-[var(--surface-2)]"><th className="p-3">観点</th><th className="p-3">パイロット</th><th className="p-3">航空管制官</th></tr></thead><tbody>{rows.map(x=><tr key={x[0]} className="border-t border-[var(--border)] align-top"><th className="p-3">{x[0]}</th><td className="p-3">{x[1]}</td><td className="p-3">{x[2]}</td></tr>)}</tbody></table></div></section>
<section className="space-y-3"><h2 className="text-xl font-bold">資格は何が違う？</h2><p>ANAは、操縦資格を持つ人の採用に加えて、未経験から訓練する自社養成パイロットの経路を案内している。学歴や応募条件はその年度の募集要項で確認する必要がある。</p><p>一方、航空管制官は人事院の採用試験に合格した後も研修を経る。国土交通省の説明では必要な技能試験に合格して任命される。試験合格直後から一人で管制できるわけではない。</p></section>
<section className="space-y-3"><h2 className="text-xl font-bold">どちらに関心がある？</h2><p>一機の操縦・運航の技術を高めたいならパイロット、複数の航空機と空域の交通を調整する仕事に関心があるなら航空管制官が比較の起点になる。両者が交信することは、責任範囲が同じという意味ではない。</p><p><Link className="underline" href="/jobs/airline-pilot">パイロットの職業ページ ↗</Link> / <Link className="underline" href="/jobs/air-traffic-controller">航空管制官の職業ページ ↗</Link></p></section>
<section><h2 className="text-xl font-bold">一次資料</h2><ul className="list-disc pl-5"><li><a className="underline" href="https://www.ana.co.jp/group/recruit/ana-recruit/occupation/pilot/">ANA｜運航乗務職・自社養成</a></li><li><a className="underline" href="https://www.mlit.go.jp/koku/atc/work.html">国土交通省｜航空管制官の仕事内容</a></li><li><a className="underline" href="https://www.mlit.go.jp/koku/atc/howto.html">国土交通省｜航空管制官になるには</a></li></ul></section>
</article>}