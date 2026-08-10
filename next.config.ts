import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare Pages単体（Workerなし）で配信するための静的エクスポート。
  // 出力先は `out/`（Next.jsの仕様で固定。distDirでは変えられない）。
  // API routes・middleware・cookies()/headers() 等の動的APIは使わない。
  // 職業ページはすべてビルド時に生成する（1職業 = 1実ページ = SEO資産）。
  output: "export",
  // 職業のビジュアルはすべて絵文字で表現するため、画像は一切扱わない。
  images: { unoptimized: true },
};

export default nextConfig;
