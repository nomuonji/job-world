"use client";

import { useRouter } from "next/navigation";

/**
 * ランダムな職業へ飛ぶ。
 * 静的エクスポートでもクライアント側の遷移なら実装できる。
 * 渡すのは slug の配列だけなので、バンドルへの負荷はほぼない。
 */
export function RandomJump({ slugs }: { slugs: string[] }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        const slug = slugs[Math.floor(Math.random() * slugs.length)];
        router.push(`/jobs/${slug}`);
      }}
      className="mt-6 rounded-full bg-[var(--accent)] px-6 py-2.5 font-semibold text-[var(--background)] transition-opacity hover:opacity-85"
    >
      知らない仕事にとびこむ →
    </button>
  );
}
