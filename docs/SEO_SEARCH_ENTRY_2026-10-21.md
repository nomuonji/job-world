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


## 同日追補：残り8職業とインデックス実測

### 実際のSearch Console観測
正しいSites Operator登録は `wiki-job-world`（`job-world` ではない）。2026-10-21にURL Inspectionキャッシュを集計した結果、163URLのうち3件が `Submitted and indexed`、144件が `Crawled - currently not indexed`、16件が `URL is unknown to Google`。職業150件だけでは、3件インデックス観測、142件クロール済み未登録、5件Google未認識。144件のクロール済み未登録には `pageFetchState=SUCCESSFUL`、`robotsTxtState=ALLOWED` が観測され、単純なブロックや全体的な配信失敗という根拠はない。ただし過去の観測であり今日の再クロールを表さない。ホームページも2026-08-18のクロール記録を含め「クロール済み・未登録」。インデックスを保証する技術的手段はない。

GSC集約ダイジェスト（計測終了 2026-10-17）:
- 直近28日 (2026-09-20〜10-17): 表示1、クリック0、平均順位7（標本1のため順位は判断に不向き）
- その前の28日: 表示7、クリック0
- 直近90日: 表示447、クリック4、平均順位約38.68
- 直近28日GA4オーガニックセッション13。GSCクリック数とGA4セッション数は指標・集計方法が異なるので合算や同一視をしない。

インデックス率を上げるための対応は「ページがクロールできる」ことだけでなく、固有の読者価値・検索入口・文書品質の改善。Googleの採否とサイト品質の因果は今回の実測からは未確定。

### Phase 2 : 改稿合計12職業
前フェーズの航空管制官、グランドハンドリング、ドローンパイロット、竹細工職人に加え、客室乗務員、ロケット射場技術者、人工衛星運用管制官、桶職人、筆職人、漆芸家、和紙職人、刀鍛冶を改稿。あわせて、宇宙に関わる仕事のガイドと、パイロット・航空管制官／ロケット射場・衛星運用の比較ページを追加。ホーム・職業一覧・詳細の横断内部リンクを強化。

追加した一次情報・現場説明の主な出典:
- ANA: https://www.ana.co.jp/group/recruit/ana-recruit/occupation/ca/
- JAXA: https://www.rocket.jaxa.jp/rocket/h3/groundEquipment.html
- JAXA: https://www.satnavi.jaxa.jp/ja/satellite-knowledge/satelife/work/index.html
- 三菱重工: https://www.mhi.com/jp/business/products-services/space-defense/launch-service/launch-site
- 伝統工芸 青山スクエア 熊野筆: https://kougeihin.jp/craft/1007/
- 同 美濃和紙: https://kougeihin.jp/craft/0903/
- 同 輪島塗: https://kougeihin.jp/craft/0513/
- 文化庁 刀匠の作刀承認: https://www.bunka.go.jp/seisaku/bunka_gyosei/shokan_horei/juhotouken/index.html
- 木桶職人復活プロジェクト: https://yama-roku.net/kioke

### 受入と今後の観測
- この変更は検索順位を保証しない。公開済みURLを維持し、noindexタグ154件の扱いを変更しない。
- `npm run data:validate`、`npm run seo:check`、`npm run build` が成功すること、mainのCloudflare Pages production commit一致を必須とする。
- 検索効果は少なくとも次のクロール/インデックス更新と28日単位のGSC計測後に比較。未観測URLをインデックス済みとみなさない。
- 新ガイドの公開時にSites OperatorのURL在庫が旧163URLのままなら、新たな6ガイドと /compare の在庫差分を確認する（URL追加・調整は現行キャッシュ管理の契約を確認して実施）。
- GoogleのURL Inspection自体はインデックス登録申請ではない。ユーザーの手動申請や外部操作が必要であればそれを明記し、実行したと偽らない。
