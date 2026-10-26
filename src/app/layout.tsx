import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import "./globals.css";
import "./editorial-atlas.css";
import "./edition-two.css";
import "./home-fixes.css";
import "./world-atlas.css";
import "./world-atlas-refinement.css";
import "./relationship-map.css";
import "./world-map-labels.css";

// 公開URL: job.antonbase.com（metadataBase・sitemap.ts・robots.ts に反映）
export const SITE_URL = "https://job.antonbase.com";
export const SITE_NAME = "しごと図鑑";
// サイト全体の説明。metadata と構造化データ（Organization/WebSite）で同じ文を使う。
export const SITE_DESCRIPTION =
  "世の中にある仕事を、舞台・扱うもの・動作・感覚など7つの角度でつないだ職業図鑑。知っている仕事から辿っていくと、名前も知らなかった仕事に行き着きます。150職業を収録し、仕事の比較ガイドも用意しています。";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — 普通に生きていたら出会わない仕事に出会う`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "ja_JP",
    images: [{ url: "/og/default.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@shikaku_catalog",
    creator: "@shikaku_catalog",
    images: ["/og/default.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body className="min-h-screen">
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-CW8JV3NBHZ"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag() { dataLayer.push(arguments); }
            if (location.hostname === "job.antonbase.com") {
              gtag("js", new Date());
              gtag("config", "G-CW8JV3NBHZ");
            }
          `}
        </Script>
        <header className="atlas-site-header border-b border-[var(--border)] bg-[var(--surface)]">
          <div className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3">
            <Link href="/" className="atlas-wordmark font-bold tracking-tight"><span aria-hidden="true">◎</span> {SITE_NAME}<small>名前の知らない仕事へ</small></Link>
            <nav className="atlas-site-nav flex gap-4 text-sm text-[var(--muted)]" aria-label="図鑑のナビゲーション">
              <Link href="/jobs" className="hover:text-[var(--accent)]">
                職業一覧
              </Link>
              <Link href="/guides" className="hover:text-[var(--accent)]">仕事のガイド</Link>
              <Link href="/compare" className="hover:text-[var(--accent)]">仕事の比較室</Link>
              <Link href="/rare-jobs" className="hover:text-[var(--accent)]">
                珍しい仕事
              </Link>
              <Link href="/facets" className="hover:text-[var(--accent)]">
                7つの角度
              </Link>
              <Link href="/about" className="hover:text-[var(--accent)]">
                この図鑑について
              </Link>
              <a
                href="https://shikaku.antonbase.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[var(--accent)]"
              >
                🎓 資格カタログ
              </a>
            </nav>
          </div>
        </header>

        <main className="atlas-main mx-auto max-w-5xl px-4 py-8">{children}</main>

        <footer className="atlas-site-footer mt-16 border-t border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--muted)]">
          <p>{SITE_NAME} — 資格と仕事の図鑑</p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <a
              href="https://shikaku.antonbase.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-[var(--accent)]"
            >
              🎓 資格カタログ（資格を調べる）
            </a>
            <a
              href="https://x.com/shikaku_catalog"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-[var(--accent)]"
            >
              X (Twitter)
            </a>
            <a
              href="https://www.threads.com/@certifications_catalog"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-[var(--accent)]"
            >
              Threads
            </a>
          </div>
        </footer>
      </body>
    </html>
  );
}
