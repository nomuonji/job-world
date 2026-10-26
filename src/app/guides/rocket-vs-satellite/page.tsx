import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { RelatedJobs } from "@/components/RelatedJobs";
import { SharedTagsNote } from "@/components/SharedTagsNote";
import { pageGraph } from "@/lib/schema";
const GUIDE_TITLE = "ロケット射場技術者と人工衛星運用管制官の違い｜宇宙の仕事";
const GUIDE_DESCRIPTION = "打ち上げまでを支える射場技術者と、打ち上げ後の衛星を地上から運用する管制担当者。仕事の段階、設備、就職先の調べ方を比較。関わる時期・扱う対象・主な作業で並べ、採用先の探し方まで整理します。";
export const metadata: Metadata={title:GUIDE_TITLE,description:GUIDE_DESCRIPTION,alternates:{canonical:"/guides/rocket-vs-satellite"}};
const jobs=[
{slug:"rocket-launch-technician",name:"ロケット射場技術者",phase:"ロケット打上げ前〜発射",object:"地上設備・発射台・移動設備・供給設備",action:"設備点検、機体移動や組立・発射に関わる地上支援"},
{slug:"satellite-controller",name:"人工衛星運用管制官",phase:"打上げ後の初期運用〜定常運用",object:"衛星のテレメトリ・通信・コマンド・運用計画",action:"機器の状態判断、地上からの指令、観測計画の確認"},
];
export default function RocketSatellite(){return <article className="mx-auto max-w-4xl space-y-8 leading-8">
<JsonLd data={pageGraph({path:"/guides/rocket-vs-satellite",name:GUIDE_TITLE,description:GUIDE_DESCRIPTION,trail:[{name:"しごと図鑑",path:""},{name:"仕事のガイド",path:"/guides"},{name:"ロケットと衛星運用",path:"/guides/rocket-vs-satellite"}]})} />
<nav className="text-sm text-[var(--muted)]"><Link className="underline" href="/guides">仕事のガイド</Link> / ロケットと衛星運用</nav><header className="space-y-3"><p className="text-sm font-bold text-[var(--accent)]">LAUNCH TO MISSION / TWO PHASES</p><h1 className="text-3xl font-bold">ロケットの打上げと、人工衛星の運用。仕事はどこで変わる？</h1><p>打上げは終点ではなく、衛星にとっては仕事の始まり。射場で設備を整える技術者と、地上から衛星の状態を見守る担当者は、宇宙開発の異なる局面を担当する。</p></header>
<section className="space-y-4"><h2 className="text-2xl font-bold">同じ「宇宙系技術職」でも違う</h2><div className="grid gap-4 md:grid-cols-2">{jobs.map(j=><section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5" key={j.slug}><h3 className="text-xl font-bold"><Link className="underline" href={`/jobs/${j.slug}`}>{j.name} ↗</Link></h3><dl className="mt-3"><dt className="font-bold">関わる時期</dt><dd>{j.phase}</dd><dt className="mt-3 font-bold">扱う対象</dt><dd>{j.object}</dd><dt className="mt-3 font-bold">主な作業</dt><dd>{j.action}</dd></dl></section>)}</div></section>
<section className="space-y-3"><h2 className="text-xl font-bold">仕事の現場を選ぶときの違い</h2><p>射場の仕事では地上設備の機械・電気・制御、安全な発射準備などが関わる。JAXAは射点系設備と、追尾や飛行安全に用いる射場系設備を区別している。</p><p>衛星の運用側では、打上げ前から運用手順と訓練を用意し、打上げ後は衛星のテレメトリから機器の状態を判断する。JAXAによると定常運用には企業への委託もあるため、採用先は宇宙機関だけではない。</p><p>どちらも単一の資格名から選ぶのでなく、設備・通信・ソフトウェア・運用など、実際に担当する技術と勤務地を求人ごとに確認する。</p><p><Link className="underline" href="/guides/space-jobs">宇宙に関わる仕事の全体像 ↗</Link></p></section>
<SharedTagsNote a="rocket-launch-technician" b="satellite-controller" />
<RelatedJobs slugs={["rocket-launch-technician","satellite-controller"]} />
<section className="space-y-2"><h2 className="text-xl font-bold">一次資料</h2><ul className="list-disc pl-5"><li><a className="underline" href="https://www.rocket.jaxa.jp/rocket/h3/groundEquipment.html">JAXA｜ロケットの地上設備</a></li><li><a className="underline" href="https://www.satnavi.jaxa.jp/ja/satellite-knowledge/satelife/work/index.html">JAXA｜衛星の定常運用</a></li><li><a className="underline" href="https://www.satnavi.jaxa.jp/ja/satellite-knowledge/satelife/preparation/index.html">JAXA｜衛星運用の準備</a></li></ul></section>
</article>}