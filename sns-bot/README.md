# SNS bot（しごと図鑑 / job.antonbase.com）

job-world の職業データ（`src/data/jobs/*.json`）から投稿文を生成し、X / Threads に自動投稿するbot。
資格カタログ（shikaku-wiki）の bot と同じ構成・同じアカウントで運用する。

## 特徴

- **ゼロ依存**（Node.js 20+ の標準 fetch / crypto のみ。npm install 不要）
- **認証情報はコミットしない**。X OAuth1 と Threads トークンは **Secret Gist** で管理
- **Threads トークンは自動リフレッシュ**（Gist に書き戻す）
- **URL 付き投稿は1日1本まで**（SNSアルゴリズム対策。state の `lastUrlDate` で制御）
- 投稿文は URL なしでも完結する価値内容（summary + surprise）にして、リンクは補足

## ディレクトリ構成

```
sns-bot/
├── tweet.jsonl                  # 投稿キュー（src/data/jobs から生成・コミット済み）
├── tweet_state.json             # X の投稿位置・URL制限（コミット済み）
├── threads_state.json           # Threads の投稿位置・URL制限（コミット済み）
├── .env.example
└── src/
    ├── generateQueue.mjs        # jobs JSON → tweet.jsonl（冪等・新規のみ追加）
    ├── format.mjs               # 【今日の職業】テンプレート
    ├── credStore.mjs            # 認証情報の Gist 読み書き
    ├── oauth1.mjs / x.mjs       # X API v2 OAuth 1.0a 署名・投稿
    ├── threadsClient.mjs        # Threads Graph API クライアント
    ├── threadsAuth.mjs          # Threads トークン自動リフレッシュ
    ├── threads-refresh.mjs      # Threads トークン強制リフレッシュ
    ├── queue.mjs                # キュー・ラウンドロビン状態管理
    ├── tweetSender.mjs          # X 投稿（1日1本）
    └── threadsSender.mjs        # Threads 投稿（1日1本）
```

## コマンド

```bash
# キュー更新（src/data/jobs の新規職業を追加）
node sns-bot/src/generateQueue.mjs

# ドライラン（投稿せず文面のみ表示・状態は進めない）
node sns-bot/src/tweetSender.mjs --dry-run
node sns-bot/src/threadsSender.mjs --dry-run

# 実際に投稿（認証情報は Gist から）
node sns-bot/src/tweetSender.mjs
node sns-bot/src/threadsSender.mjs

# Threads トークンの強制リフレッシュ
node sns-bot/src/threads-refresh.mjs
```

## 投稿文の形式

```
【今日の職業】<職名> <絵文字>

<summaryJa>

<surpriseJa>

🔗 https://job.antonbase.com/jobs/<slug>

#珍しい仕事 #しごと図鑑
```

URL は job.antonbase.com の職業ページへ。SNSアルゴリズム対策として URL 付き投稿は1日1本。

## 認証情報の準備（初回のみ）

shikaku-wiki と同じ Secret Gist 方式。

1. **Secret Gist** に `credentials.json`（X OAuth1 4点 + Threads token/user_id）を置く
2. Actions secrets に `GH_GIST_TOKEN`（gist スコープのみのPAT）と `GIST_ID` を設定
3. ローカル検証は `LOCAL_CRED_FILE=sns-bot/.credentials.local.json`（Gitignore済み）

## GitHub Actions

| workflow | 実行 | 内容 |
|---|---|---|
| `sns-bot.yml` | 毎日 JST 12:00 | キュー更新→XとThreadsに各1投稿 |
| `threads-refresh.yml` | 毎月1日 | Threadsトークンを強制リフレッシュ |

## 注意

- キュー・state は Actions がコミットして同期する。CI（`data:check`）は `src/data` のみ
  差分検査するため、`sns-bot/` の変更では失敗しない。
- 公開リポジトリでも認証情報が漏れない設計（トークンは常に Gist 経由）。
