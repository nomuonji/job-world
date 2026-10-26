import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { pageGraph } from "@/lib/schema";

const GUIDE_TITLE = "空港で働く仕事の種類｜仕事内容・なり方・役割の違い";
const GUIDE_DESCRIPTION =
  "航空管制官、航空整備士、グランドハンドリング、パイロット、客室乗務員など。空港に関わる仕事を、1便の流れに沿って担当工程と就職の入口で比べる。客室と地上の分担、混同しやすい整備と地上支援の違いも整理します。";

export const metadata: Metadata = {
  title: GUIDE_TITLE,
  description: GUIDE_DESCRIPTION,
  alternates: { canonical: "/guides/airport-jobs" },
};

const occupations = [
  {slug:"air-traffic-controller",name:"航空管制官",when:"離着陸の順序や飛行中の安全間隔を管理する",work:"無線で指示し、飛行場や担当空域の交通を調整する",entry:"国家公務員の採用試験から研修・技能試験へ"},
  {slug:"aircraft-maintenance-engineer",name:"航空整備士",when:"出発前の点検から格納庫での整備まで",work:"機体・装備品の点検、修理、整備記録、権限に応じた確認",entry:"整備会社等への就職と、担当業務に応じた訓練・資格"},
  {slug:"airport-ramp-agent",name:"グランドハンドリング",when:"機体の到着から次の出発まで",work:"航空機の誘導、手荷物・貨物の搭降載、地上支援など",entry:"ランプ・旅客・貨物等、担当工程別の採用を確認"},
  {slug:"airline-pilot",name:"エアラインパイロット",when:"飛行前の準備から運航中まで",work:"航空機を操縦し、運航手順と安全に責任を持つ",entry:"航空会社などの養成・採用経路と資格要件を調べる"},
  {slug:"flight-attendant",name:"客室乗務員",when:"搭乗前から機内・降機まで",work:"客室の安全確認、緊急時の対応、旅客サービス",entry:"航空会社の募集要項と入社後の保安訓練を確認"},
];

export default function AirportJobsGuide() {
  return <article className="max-w-4xl space-y-9 leading-8">
    <JsonLd data={pageGraph({path:"/guides/airport-jobs",name:GUIDE_TITLE,description:GUIDE_DESCRIPTION,trail:[{name:"しごと図鑑",path:""},{name:"仕事のガイド",path:"/guides"},{name:"空港で働く仕事",path:"/guides/airport-jobs"}]})} />
    <nav className="text-sm text-[var(--muted)]"><Link className="underline" href="/guides">仕事のガイド</Link> / 空港で働く仕事</nav>
    <header className="space-y-3"><p className="text-sm font-bold text-[var(--accent)]">AIRPORT / WHO DOES WHAT</p>
      <h1 className="text-3xl font-bold">空港で働く仕事の種類。誰が何をしている？</h1>
      <p>飛行機が着陸してから次の便が離陸するまで、仕事は一つではありません。地上で機体を動かす人、整備する人、離着陸を管制する人、機内で安全を守る人。同じ空港でも、採用経路と必要な訓練は大きく違います。</p>
    </header>
    <section className="space-y-3"><h2 className="text-2xl font-bold">航空機の一便を、担当工程から見る</h2>
      <ol className="grid gap-3 md:grid-cols-3">
        <li className="rounded-lg border border-[var(--border)] p-4"><strong>1. 到着前・着陸</strong><p>管制官が交通を調整し、パイロットが飛行・着陸を担当する。</p></li>
        <li className="rounded-lg border border-[var(--border)] p-4"><strong>2. 駐機場での折り返し</strong><p>地上支援担当が荷物や機体周辺の作業を進め、整備担当が点検・不具合対応を行う。</p></li>
        <li className="rounded-lg border border-[var(--border)] p-4"><strong>3. 次便の準備・出発</strong><p>客室乗務員は機内の安全確認、地上側は搭載・押し出しなどを分担し、運航へつなぐ。</p></li>
      </ol>
      <p className="text-sm text-[var(--muted)]">一般的な業務の関係を整理した模式的な説明です。会社や空港の分担、実際の運航順序は異なります。</p>
    </section>
    <section className="space-y-3"><h2 className="text-2xl font-bold">代表的な5つの仕事を比較</h2>
      <div className="grid gap-4">{occupations.map((job)=><section key={job.slug} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
        <h3 className="text-xl font-bold"><Link className="underline" href={`/jobs/${job.slug}`}>{job.name}の仕事内容へ ↗</Link></h3>
        <dl className="mt-3 grid gap-2 md:grid-cols-2"><div><dt className="font-bold">関わる場面</dt><dd>{job.when}</dd></div><div><dt className="font-bold">主な役割</dt><dd>{job.work}</dd></div><div className="md:col-span-2"><dt className="font-bold">なり方を調べる入口</dt><dd>{job.entry}</dd></div></dl>
      </section>)}</div>
    </section>
    <section className="space-y-3"><h2 className="text-2xl font-bold">迷ったら、まず「何を担当したいか」を決める</h2>
      <p>「飛行機が好き」という共通点から就職先を選ぶと、現場に入ってから業務が違うと気づくことがあります。航空機の状態を調べたいなら整備、空港の地上作業ならグランドハンドリング、飛行の順序と安全間隔なら管制、機内の安全なら客室乗務という具合に、関心を具体的な行動へ言い換えると比較しやすくなります。</p>
      <p>とくに航空整備と地上支援は近い場所で働くため混同されがちです。<Link className="underline" href="/guides/ground-handling-vs-maintenance">航空整備士とグランドハンドリングの違い</Link>で担当境界を確認できます。</p>
    </section>
    <section className="space-y-2"><h2 className="text-xl font-bold">一次資料</h2><ul className="list-disc space-y-2 pl-5">
      <li><a className="underline" href="https://www.mlit.go.jp/koku/koku_fr5_000058.html">国土交通省｜グランドハンドリング</a>（地上支援作業の定義）</li>
      <li><a className="underline" href="https://www.mlit.go.jp/koku/atc/work.html">国土交通省｜航空管制官の仕事内容</a></li>
      <li><a className="underline" href="https://www.mlit.go.jp/koku/15_bf_000299.html">国土交通省｜航空従事者の資格制度</a></li></ul>
      <p className="text-sm text-[var(--muted)]">資料確認：2026年10月21日。採用条件は各社・各年度の公式募集要項で確認してください。</p>
    </section>
  </article>;
}
