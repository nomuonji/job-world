import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "伝統工芸の職人になるには｜産地・修業先の調べ方",
  description: "竹細工、桶、筆、漆、和紙などの職人を比較。産地の調べ方、工房・研修先の探し方、伝統工芸士認定との違いを整理。",
  alternates: { canonical: "/guides/traditional-crafts" },
};

const crafts = [
  {slug:"bamboo-artisan",name:"竹細工職人",point:"竹を割る・ひごを作る・編む。産地と技法によって作るものが変わる。"},
  {slug:"barrel-maker",name:"桶職人",point:"木を削って組み、締める。材料と接合の技術が中心。"},
  {slug:"brush-maker",name:"筆職人",point:"毛を選別・組み合わせ、用途に合った筆先を作る。"},
  {slug:"urushi-lacquerer",name:"漆芸家",point:"下地、塗り、研ぎなど工程ごとの技能が必要。"},
  {slug:"washi-papermaker",name:"和紙職人",point:"原料処理と紙漉き。地域で原料と製法が異なる。"},
  {slug:"swordsmith",name:"刀鍛冶",point:"刀剣の鍛造。修業制度や資格要件は別途確認が必要。"},
];

export default function CraftsGuide() {
  return <article className="max-w-4xl space-y-9 leading-8">
    <nav className="text-sm text-[var(--muted)]"><Link className="underline" href="/guides">仕事のガイド</Link> / 伝統工芸の職人</nav>
    <header className="space-y-3"><p className="text-sm font-bold text-[var(--accent)]">CRAFT / PATHS INTO WORK</p>
      <h1 className="text-3xl font-bold">伝統工芸の職人になるには。まず何を探す？</h1>
      <p>「職人になりたい」と思っても、工芸の種類ごとに材料、技法、産地、働き方が違います。工房の弟子入りだけが唯一の道とは限りません。職業名から、実際の産地と現在の研修・募集の情報へ辿る手順を整理しました。</p>
    </header>
    <section className="space-y-3"><h2 className="text-2xl font-bold">入口は「仕事」よりも「技法と産地」</h2><ol className="grid gap-4 md:grid-cols-3">
      <li className="rounded-lg border border-[var(--border)] p-4"><strong>1. 何を作りたいか</strong><p>竹、木、紙、漆、金属など、扱う素材と手を動かす工程から選ぶ。</p></li>
      <li className="rounded-lg border border-[var(--border)] p-4"><strong>2. どこで学べるか</strong><p>産地団体・工房・学校・自治体の研修情報を調べ、見学・体験の受入れを確認する。</p></li>
      <li className="rounded-lg border border-[var(--border)] p-4"><strong>3. 仕事になる条件か</strong><p>募集の有無、費用、契約、報酬、修業期間、材料費を個別に比較する。</p></li></ol>
      <p>「伝統的工芸品」は工芸品の指定制度、「伝統工芸士」は長年の実務経験を積んだ人などを認定する制度です。伝統工芸士の認定を先に取らないと職人を始められない、という意味ではありません。</p>
    </section>
    <section className="space-y-3"><h2 className="text-2xl font-bold">どんな仕事をする？ 素材と作業で比較</h2>
      <ul className="grid gap-3 md:grid-cols-2">{crafts.map(c=><li className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5" key={c.slug}>
        <h3 className="font-bold text-lg"><Link className="underline" href={`/jobs/${c.slug}`}>{c.name} ↗</Link></h3><p>{c.point}</p></li>)}</ul>
    </section>
    <section className="space-y-3"><h2 className="text-2xl font-bold">応募前に確認すること</h2>
      <p>「見習い募集」という表現でも、雇用契約と受講型研修では条件が異なります。就業を検討するときは、契約・報酬の有無、習得する工程、指導担当者、費用負担、独立や就職への道筋を尋ねることが重要です。入門から自動的に職人として独立できるとは限りません。</p>
      <p>産地・職業を俯瞰するには、<a className="underline" href="https://kougeihin.jp/learn/">伝統工芸 青山スクエアの工芸品・地域別一覧</a>が便利です。ただし一覧に載っていることは、現在の採用枠があることを意味しません。</p>
    </section>
    <section className="space-y-2"><h2 className="text-xl font-bold">参考にした一次情報</h2><ul className="list-disc space-y-2 pl-5">
      <li><a className="underline" href="https://kyokai.kougeihin.jp/master/">伝統的工芸品産業振興協会｜伝統工芸士の認定</a></li>
      <li><a className="underline" href="https://kougeihin.jp/craft_industry/mokkoutake/">伝統工芸 青山スクエア｜木工品・竹工品</a></li>
      <li><a className="underline" href="https://www.bunka.go.jp/seisaku/bunkazai/joseishien/bunkakensyuuzigyou/r07/index.html">文化庁｜工芸技術の研修事業（過去募集例）</a></li>
    </ul><p className="text-sm text-[var(--muted)]">制度資料確認：2026年10月21日。過去の公募は現在の募集ではありません。</p></section>
  </article>;
}
