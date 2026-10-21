import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "仕事の調べ方・職業比較ガイド",
  description: "どんな仕事があるか、どうやってなるか、似た仕事はどう違うか。しごと図鑑の職業データを横断して調べる入口。",
  alternates: { canonical: "/guides" },
};

const guides = [
  { href: "/guides/airport-jobs", title: "空港で働く仕事の種類", description: "管制官・整備士・地上支援・客室乗務員。それぞれ誰が何を担当するのか。" },
  { href: "/guides/traditional-crafts", title: "伝統工芸の職人になるには", description: "技法・産地・修業先の探し方と、伝統工芸士認定との違い。" },
  { href: "/guides/ground-handling-vs-maintenance", title: "航空整備士とグランドハンドリングの違い", description: "同じ飛行機を支える二つの仕事を、作業・資格・進路で比較。" },
];

export default function GuidesPage() {
  return <article className="max-w-4xl space-y-7">
    <nav className="text-sm text-[var(--muted)]"><Link href="/" className="underline">しごと図鑑</Link> / 調べ方・比較ガイド</nav>
    <header className="space-y-3">
      <p className="text-sm font-bold text-[var(--accent)]">OCCUPATION FIELD GUIDES</p>
      <h1 className="text-3xl font-bold">仕事を、名前の外から調べる。</h1>
      <p className="leading-8">仕事をひとつずつ紹介するだけでなく、同じ現場で働く人、職人になる道筋、似た職業の違いまで見渡す。疑問を手掛かりに複数の職業へ辿れるガイドです。</p>
    </header>
    <ul className="grid gap-4 md:grid-cols-2">{guides.map((guide) => <li key={guide.href} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
      <h2 className="text-xl font-bold"><Link href={guide.href} className="underline decoration-[var(--accent)] underline-offset-4">{guide.title} ↗</Link></h2>
      <p className="mt-3 leading-7 text-[var(--muted)]">{guide.description}</p>
    </li>)}</ul>
    <p className="text-sm text-[var(--muted)]">ガイドは実際の仕事内容・制度を調べて作成しています。求人の募集状況や個人への適性を保証するものではありません。</p>
    <p><Link href="/jobs" className="underline">150職業の一覧に戻る →</Link></p>
  </article>;
}
