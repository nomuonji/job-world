import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { RelatedJobs } from "@/components/RelatedJobs";
import { pageGraph } from "@/lib/schema";
export const metadata: Metadata = {title:"宇宙に関わる仕事｜打上げ・衛星運用・宇宙飛行士の役割",description:"ロケット射場技術者、人工衛星運用管制官、宇宙飛行士。宇宙の仕事を打上げ前・打上げ後・有人活動に分け、就職先と仕事の違いを紹介。打上げ前の設備、打上げ後の運用、有人活動の3段階で必要な技術を整理します。",alternates:{canonical:"/guides/space-jobs"}};
const rows=[
{slug:"rocket-launch-technician",name:"ロケット射場技術者",when:"打上げ準備から発射まで",doing:"機体の組立・移動や発射のための地上設備を点検・運用する。機械・電気・制御など複数の専門領域が関わる。"},
{slug:"satellite-controller",name:"人工衛星運用管制官",when:"衛星の打上げ後から運用終了まで",doing:"受信信号から衛星の状態を確認し、観測計画やコマンド送信などの地上運用を担う。"},
{slug:"astronaut",name:"宇宙飛行士",when:"訓練と宇宙での任務",doing:"宇宙の有人ミッションに参加し、実験・保守・運用などを実施する。選抜と訓練は衛星運用担当者と別。"}];
export default function SpaceJobs() {return <article className="mx-auto max-w-4xl space-y-8 leading-8">
<JsonLd data={pageGraph({
  path: "/guides/space-jobs",
  name: "宇宙に関わる仕事｜打上げ・衛星運用・宇宙飛行士の役割",
  description: "ロケット射場技術者、人工衛星運用管制官、宇宙飛行士。宇宙の仕事を打上げ前・打上げ後・有人活動に分け、就職先と仕事の違いを紹介。打上げ前の設備、打上げ後の運用、有人活動の3段階で必要な技術を整理します。",
  trail: [
    { name: "しごと図鑑", path: "" },
    { name: "仕事のガイド", path: "/guides" },
    { name: "宇宙に関わる仕事", path: "/guides/space-jobs" },
  ],
})} />
<nav className="text-sm text-[var(--muted)]"><Link href="/guides" className="underline">仕事のガイド</Link> / 宇宙に関わる仕事</nav>
<header className="space-y-3"><p className="text-sm font-bold text-[var(--accent)]">SPACE OPERATIONS / WORK MAP</p><h1 className="text-3xl font-bold">宇宙に関わる仕事。打ち上げる人と、その先を見守る人。</h1><p>「宇宙の仕事」といっても、宇宙飛行士になる以外の道がある。ロケットの発射設備を支える仕事と、打ち上げた衛星を地上から動かし続ける仕事では、必要な技術と担当する時間が違う。</p></header>
<section className="space-y-3"><h2 className="text-2xl font-bold">宇宙へ行くまでと、そのあと</h2><ol className="grid gap-3 md:grid-cols-3">
<li className="rounded-lg border border-[var(--border)] p-4"><strong>1. 打上げの準備</strong><p>地上設備を点検し、機体を組み立て、移動・搭載・発射を支える。</p></li>
<li className="rounded-lg border border-[var(--border)] p-4"><strong>2. 打上げ後の初期運用</strong><p>衛星と地上の通信、機器の健全性、観測装置の校正を確認する。</p></li>
<li className="rounded-lg border border-[var(--border)] p-4"><strong>3. 定常運用</strong><p>衛星の状態を監視し、観測や通信などのミッションを継続する。</p></li></ol>
<p>JAXAの説明では、地上設備も衛星運用も複数の企業・専門チームが関わる。全工程を同一の職業が担当するわけではない。</p></section>
<section className="space-y-3"><h2 className="text-2xl font-bold">職業を担当段階から比較する</h2><div className="grid gap-4">{rows.map(row=><section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5" key={row.slug}><h3 className="text-xl font-bold"><Link className="underline" href={`/jobs/${row.slug}`}>{row.name} ↗</Link></h3><dl className="mt-2"><dt className="font-bold">中心になる時期</dt><dd>{row.when}</dd><dt className="mt-2 font-bold">何をするか</dt><dd>{row.doing}</dd></dl></section>)}</div></section>
<section className="space-y-3"><h2 className="text-xl font-bold">地上で宇宙に関わる仕事へ進むには</h2><p>宇宙開発には機械・電気・通信・ソフトウェア・運用管制など複数の専門分野がある。「宇宙に関われる」という広告文言だけでなく、どの設備や衛星を担当するか、職務経験・教育・勤務地・運用体制を企業の採用情報から確認したい。</p><p><Link href="/guides/rocket-vs-satellite" className="underline">ロケット射場技術者と衛星運用管制官の違い ↗</Link></p></section>
<RelatedJobs slugs={["rocket-launch-technician","satellite-controller","astronaut"]} />
<section className="space-y-2"><h2 className="text-xl font-bold">一次資料</h2><ul className="list-disc pl-5"><li><a className="underline" href="https://www.rocket.jaxa.jp/rocket/h3/groundEquipment.html">JAXA｜H3の地上設備</a></li><li><a className="underline" href="https://www.satnavi.jaxa.jp/ja/satellite-knowledge/satelife/work/index.html">JAXA｜衛星の定常運用</a></li><li><a className="underline" href="https://www.satnavi.jaxa.jp/ja/satellite-knowledge/satelife/preparation/index.html">JAXA｜運用開始前の準備</a></li></ul></section>
</article>}