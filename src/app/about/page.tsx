import type { Metadata } from "next";
import Link from "next/link";
import { getAllJobs, getFacets } from "@/lib/data";

export const metadata: Metadata = {
  title: "この図鑑について",
  description:
    "何を集めていて、何を集めていないか。データの作り方と、書いてある内容の確かさについて。",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  const jobs = getAllJobs();
  const facets = getFacets();

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold">この図鑑について</h1>

      <section className="mt-8">
        <h2 className="text-xl font-bold">何のためのサイトか</h2>
        <p className="mt-2">
          人は、自分の生活の中で見た仕事しか思いつけません。求人サイトは
          「探している職種の名前」を知っている人のために作られているので、
          名前を知らない仕事には、いつまで経っても行き当たりません。
        </p>
        <p className="mt-2">
          このサイトは、仕事どうしをタグでつなぎ、
          知っている仕事から辿っていくと知らない仕事に出るように作られています。
          現在 {jobs.length} 件を収録しています。
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-bold">やらないこと</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>求人情報・給与・募集の掲載（これは求人サイトではありません）</li>
          <li>すべての仕事を一枚の図に描くこと（線が多すぎて何も読めなくなるため）</li>
          <li>職業の網羅（分類表を端から埋めることは目指していません）</li>
          <li>ログインやおすすめの個人最適化</li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-bold">つながりの作り方</h2>
        <p className="mt-2">
          仕事どうしの線は、人が一本ずつ引いているわけではありません。
          {facets.length}
          つの角度に分けたタグの重なりから、自動的に計算しています。
        </p>
        <p className="mt-2">
          そのとき、珍しいタグを共有しているほど強くつながるようにし、
          さらに<strong>業界が違う相手を意図的に上位へ押し上げて</strong>います。
          これをしないと、パティシエの隣はショコラティエとブーランジェで埋まってしまい、
          何歩進んでもお菓子の世界から出られないからです。
        </p>
        <p className="mt-2">
          <Link href="/facets" className="text-[var(--accent)] underline">
            7つの角度について
          </Link>
          ／
          <Link href="/stats" className="text-[var(--accent)] underline">
            現在の状態と実測値
          </Link>
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-bold">書いてある内容について</h2>
        <p className="mt-2">
          各ページの文章は、公開されている資料をもとに作成しています。
          出典は各ページの末尾に記載しました。
        </p>
        <p className="mt-2">
          文章の作成には生成AIを使っています。事実関係は公的機関や業界団体の情報を
          参照して書いていますが、誤りが残っている可能性があります。
          進路の判断など重要な用途では、必ず出典元や当事者の情報をご確認ください。
        </p>
        <p className="mt-2">
          職業の珍しさ・知られ方の数値は、統計に基づく厳密な値ではなく、
          探索の手がかりとして付けた目安です。
        </p>
      </section>
    </div>
  );
}
