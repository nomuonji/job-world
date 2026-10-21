# 仕事図鑑｜検索入口と記事品質の改善（2026-10-21）

## 目的
「職業名を既に知っている人」以外の検索意図を取り込む。ただのタグ一覧大量公開や職業名ページの量産ではなく、同じ現場・進路・仕事の境界を横断比較できるページを提供する。既存の「仕事の地図」は維持する。

## 今回の実装
- /guides/：横断ガイド一覧
- /guides/airport-jobs：空港で働く仕事の担当工程別ガイド
- /guides/traditional-crafts：職人になる経路・産地・技能認定の違い
- /guides/ground-handling-vs-maintenance：整備と地上支援の担当業務・資格比較
- 航空管制官、グランドハンドリング、ドローンパイロット、竹細工職人：一次情報を用いた仕事内容・業務例・進路の改稿
- 各職業から関連ガイドへの内部リンク、/jobs/ と /rare-jobs/ からの入口、sitemapへの追加
- scripts/validate-seo.ts で対象4職業の最低限の内容・出典を検証

## 確認した一次情報
- 国土交通省 https://www.mlit.go.jp/koku/koku_fr5_000058.html
- 国土交通省 https://www.mlit.go.jp/report/press/content/001974818.pdf
- 国土交通省 https://www.mlit.go.jp/koku/atc/work.html
- 国土交通省 https://www.mlit.go.jp/koku/atc/howto.html
- 人事院 https://www.jinji.go.jp/saiyo/siken/sennmonnsyoku_daisotsu/kannseikann/kansei_daisotu.html
- 国土交通省 https://www.mlit.go.jp/koku/license.html
- 国土交通省 https://www.mlit.go.jp/koku/permitapproval/
- 国土交通省 https://www.mlit.go.jp/koku/15_bf_000299.html
- 伝統工芸 青山スクエア https://kougeihin.jp/craft_industry/mokkoutake/
- 伝統的工芸品産業振興協会 https://kyokai.kougeihin.jp/master/

## 品質と運用
- tagページ154件は noindex/follow、sitemap非掲載を維持する
- 募集中の求人がない限り JobPosting を付与しない
- 各記事の出典は主張と対応付けること。制度情報や資格要件の断定には一次資料を要する
- 職業の数や文字数だけを品質・成果指標にしない。複数の仕事の比較で得られる新たな情報を求める
- AIの作文による架空の取材、根拠不明の給与・人数・成長率、架空の募集情報を禁止
- 現行記事全体への機械的な厳格ゲート強制は保留。既存の薄い記事を改稿するパイロットとして品質閾値を導入する

## SEO評価・残課題
- Sites Operator は2026-10-21に Firestore 429 が発生し、最新のGSCのクリック/表示/Index実測を取得できなかった。インデックス不良が技術要因か品質要因かは未確定
- 本番配信はこのブランチ作成時点では未確認。HTTP 200、indexable、canonical、sitemap出力、GSC登録の確認が必要
- 表示回数、CTR、検索クエリ、掲載順位は公開前後の同期間比較（各28日、データ反映遅延除外）を行う
- 新規記事の公開だけで順位向上と断定しない
- 次の改稿対象候補：craft・aerospace等の短文記事。候補の優先順位はGSC実測と品質監査で再判定する
