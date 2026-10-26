import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { itemListNode, pageGraph } from "@/lib/schema";

const PAGE_TITLE = "仕事の調べ方・職業比較ガイド";
const PAGE_DESCRIPTION =
  "空港・伝統工芸・宇宙など、同じ現場で働く仕事や似た職業の違いを横断して調べる6本のガイド一覧。担当工程・必要な訓練・進路の違いを、しごと図鑑の職業データと一次資料から比べます。各ガイドからは、扱っている職業のページへ直接移れます。";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/guides" },
};

const guides = [
  {
    href: "/guides/airport-jobs",
    title: "空港で働く仕事の種類",
    description:
      "管制官・整備士・地上支援・客室乗務員。それぞれ誰が何を担当するのか。",
    covers: "航空管制官・航空整備士・グランドハンドリング・エアラインパイロット・客室乗務員",
  },
  {
    href: "/guides/traditional-crafts",
    title: "伝統工芸の職人になるには",
    description:
      "技法・産地・修業先の探し方と、伝統工芸士認定との違い。",
    covers: "竹細工・樽職人・刷毛職人・漆芸・和紙漉き・刀鍛冶",
  },
  {
    href: "/guides/ground-handling-vs-maintenance",
    title: "航空整備士とグランドハンドリングの違い",
    description: "同じ飛行機を支える二つの仕事を、作業・資格・進路で比較。",
    covers: "航空整備士・グランドハンドリング",
  },
  {
    href: "/guides/space-jobs",
    title: "宇宙に関わる仕事の種類",
    description:
      "打上げ前の地上設備と打上げ後の衛星運用、宇宙飛行士の役割を比較。",
    covers: "ロケット射場・衛星運用・宇宙飛行士",
  },
  {
    href: "/guides/pilot-vs-controller",
    title: "パイロットと航空管制官の違い",
    description:
      "飛行機を操縦する側と、航空交通を調整する側の仕事内容と進路。",
    covers: "エアラインパイロット・航空管制官",
  },
  {
    href: "/guides/rocket-vs-satellite",
    title: "ロケット射場と人工衛星運用の違い",
    description: "ロケット打上げの設備担当と、衛星の地上運用担当を比較。",
    covers: "ロケット射場・衛星運用",
  },
];

export default function GuidesPage() {
  const structuredData = pageGraph({
    path: "/guides",
    name: "仕事の調べ方・職業比較ガイド",
    description:
      "空港・伝統工芸・宇宙など、同じ現場で働く仕事や似た職業の違いを横断して調べる6本のガイド一覧。担当工程・必要な訓練・進路の違いを、しごと図鑑の職業データと一次資料から比べます。各ガイドからは、扱っている職業のページへ直接移れます。",
    type: "CollectionPage",
    trail: [
      { name: "しごと図鑑", path: "" },
      { name: "調べ方・比較ガイド", path: "/guides" },
    ],
    itemList: itemListNode({
      path: "/guides",
      name: "仕事の調べ方・職業比較ガイド",
      items: guides.map((guide) => ({
        name: guide.title,
        path: guide.href,
      })),
    }),
  });

  return (
    <article className="max-w-4xl space-y-7">
      <JsonLd data={structuredData} />
      <nav className="text-sm text-[var(--muted)]"><Link href="/" className="underline">しごと図鑑</Link> / 調べ方・比較ガイド</nav>
      <header className="space-y-3">
        <p className="text-sm font-bold text-[var(--accent)]">OCCUPATION FIELD GUIDES</p>
        <h1 className="text-3xl font-bold">仕事を、名前の外から調べる。</h1>
        <p className="leading-8">仕事をひとつずつ紹介するだけでなく、同じ現場で働く人、職人になる道筋、似た職業の違いまで見渡す。疑問を手掛かりに複数の職業へ辿れるガイドです。</p>
      </header>
      <ul className="grid gap-4 md:grid-cols-2">{guides.map((guide) => <li key={guide.href} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="text-xl font-bold"><Link href={guide.href} className="underline decoration-[var(--accent)] underline-offset-4">{guide.title} ↗</Link></h2>
        <p className="mt-3 leading-7 text-[var(--muted)]">{guide.description}</p>
        <p className="mt-3 text-xs text-[var(--muted)]">扱う職業: {guide.covers}</p>
      </li>)}</ul>
      <section className="space-y-2">
        <h2 className="text-xl font-bold">ガイドの使い方</h2>
        <p className="leading-8">
          ガイドは「似ているけれど違う仕事」を、担当する工程・必要な訓練・就職の入口で並べ直したものです。
          名前だけでは区別できない仕事も、担当している工程が分かると比べられます。
          ガイドを読んで関心が決まったら、各職業ページで仕事内容・なり方・出典を確認してください。
        </p>
        <p className="text-sm">
          職業を一覧から探すなら
          <Link href="/jobs" className="underline">職業一覧</Link>、
          7つの角度から探すなら
          <Link href="/facets" className="underline">7つの角度</Link>、
          任意の二つの仕事をその場で並べるなら
          <Link href="/compare" className="underline">仕事の比較室</Link>、
          収録件数などの実測値は
          <Link href="/stats" className="underline">この図鑑の状態</Link>
          にあります。
        </p>
      </section>
      <p className="text-sm text-[var(--muted)]">ガイドは実際の仕事内容・制度を調べて作成しています。求人の募集状況や個人への適性を保証するものではありません。</p>
      <p><Link href="/jobs" className="underline">150職業の一覧に戻る →</Link></p>
    </article>
  );
}
