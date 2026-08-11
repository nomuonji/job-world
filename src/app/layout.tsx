import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import "./globals.css";

// 公開URL: job.antonbase.com（metadataBase・sitemap.ts・robots.ts に反映）
export const SITE_URL = "https://job.antonbase.com";
export const SITE_NAME = "しごと図鑑";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — 普通に生きていたら出会わない仕事に出会う`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "世の中にある仕事を、舞台・扱うもの・動作・感覚など7つの角度でつなげた図鑑。知っている仕事から辿っていくと、名前も知らなかった仕事に行き着きます。",
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
        <header className="border-b border-[var(--border)] bg-[var(--surface)]">
          <div className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3">
            <Link href="/" className="font-bold tracking-tight">
              🧭 {SITE_NAME}
            </Link>
            <nav className="flex gap-4 text-sm text-[var(--muted)]">
              <Link href="/jobs" className="hover:text-[var(--accent)]">
                すべての仕事
              </Link>
              <Link href="/facets" className="hover:text-[var(--accent)]">
                7つの角度
              </Link>
              <Link href="/about" className="hover:text-[var(--accent)]">
                この図鑑について
              </Link>
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>

        <footer className="mt-16 border-t border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--muted)]">
          {SITE_NAME}
        </footer>
      </body>
    </html>
  );
}
