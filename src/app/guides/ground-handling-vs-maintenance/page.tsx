import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "グランドハンドリングと航空整備士の違い｜仕事内容・資格・就職",
  description: "グランドハンドリングと航空整備士は、何を担当し、どうやってなる？ 空港の同じ機体に関わる二つの職業を役割・資格・働き方から比較。",
  alternates: { canonical: "/guides/ground-handling-vs-maintenance" },
};

const rows = [
  ["仕事の中心","航空機の到着・出発を支える地上支援業務の総称","機体や装備品の技術的な点検、修理、整備記録など"],
  ["よくある作業","誘導、搭降載、地上車両、プッシュバックなど（業務ごとに別担当）","運航整備、格納庫での機体整備、部品の工場整備など"],
  ["資格の考え方","担当機材や職種に応じた訓練・資格等を確認。すべての作業に共通する単一の国家資格ではない","航空整備士・航空運航整備士などの技能証明と、業務・機種ごとの権限に注意"],
  ["応募時に見る欄","ランプ／旅客／貨物、配属空港、勤務帯、車両操作等の条件","ライン／ドック／ショップ、採用時資格、確認権限、訓練・交替制"],
];

export default function DifferenceGuide() {
  return <article className="max-w-4xl space-y-9 leading-8">
    <nav className="text-sm text-[var(--muted)]"><Link className="underline" href="/guides">仕事のガイド</Link> / 航空整備士とグランドハンドリング</nav>
    <header className="space-y-3"><p className="text-sm font-bold text-[var(--accent)]">ONE AIRCRAFT / TWO ROLES</p>
      <h1 className="text-3xl font-bold">グランドハンドリングと航空整備士、何が違う？</h1>
      <p>どちらも空港で同じ機体に関わりますが、同じ仕事ではありません。グランドハンドリングは到着・出発の地上支援、航空整備士は機体の技術的な状態を保つ整備が中心です。作業・資格・応募先を並べて比較します。</p>
    </header>
    <section className="space-y-3"><h2 className="text-2xl font-bold">主な違いを比較</h2>
      <div className="overflow-x-auto rounded-lg border border-[var(--border)]"><table className="w-full min-w-[620px] border-collapse text-left text-sm">
        <thead className="bg-[var(--surface-2)]"><tr><th className="p-4">比較</th><th className="p-4">グランドハンドリング</th><th className="p-4">航空整備士</th></tr></thead>
        <tbody>{rows.map((r)=><tr className="border-t border-[var(--border)] align-top" key={r[0]}><th className="p-4">{r[0]}</th><td className="p-4">{r[1]}</td><td className="p-4">{r[2]}</td></tr>)}</tbody>
      </table></div>
      <p className="text-sm text-[var(--muted)]">担当範囲は会社・配属先・訓練によって変わります。特定の企業の職務区分を断定する表ではありません。</p>
    </section>
    <section className="space-y-3"><h2 className="text-2xl font-bold">同じ到着便でも、関わり方が違う</h2>
      <p>着陸した機体が駐機場へ入ると、地上支援側では誘導・搭降載・次便の準備が始まります。整備側では、機体の点検や不具合への対応、必要に応じた整備記録などを行います。作業の時間帯が重なっても、扱う対象と責任が同じとは限りません。</p>
      <p>特に「整備士は全員同じ資格が必要」「グラハンは全作業を一人で担当する」という理解は不正確です。国土交通省は航空整備士・航空運航整備士等の資格を区別し、グランドハンドリングについては複数の地上支援工程を示しています。</p>
    </section>
    <section className="space-y-3"><h2 className="text-2xl font-bold">仕事選びで確認する順番</h2>
      <ol className="list-decimal space-y-3 pl-5"><li>飛行機の周囲で地上支援をしたいのか、機体を技術的に整備したいのかを決める。</li>
      <li>求人票では「空港勤務」の表記でなく、実際の担当工程・配属先と教育制度を見る。</li>
      <li>交替勤務、勤務地、資格の取得支援、確認権限や配属変更を比較する。</li></ol>
      <p><Link className="underline" href="/jobs/airport-ramp-agent">グランドハンドリングの仕事内容を読む ↗</Link> / <Link className="underline" href="/jobs/aircraft-maintenance-engineer">航空整備士の仕事内容を読む ↗</Link></p>
      <p><Link className="underline" href="/guides/airport-jobs">空港で働く仕事の全体像に戻る ↗</Link></p>
    </section>
    <section className="space-y-2"><h2 className="text-xl font-bold">一次資料</h2><ul className="list-disc space-y-2 pl-5">
      <li><a className="underline" href="https://www.mlit.go.jp/koku/koku_fr5_000058.html">国土交通省｜グランドハンドリング</a></li>
      <li><a className="underline" href="https://www.mlit.go.jp/koku/15_bf_000299.html">国土交通省｜航空従事者の資格制度</a></li>
      <li><a className="underline" href="https://www.ltc.ana-g.com/service.html">ANAラインメンテナンステクニクス｜運航整備の工程</a></li>
    </ul><p className="text-sm text-[var(--muted)]">資料確認：2026年10月21日。</p></section>
  </article>;
}
