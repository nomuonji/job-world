"use client";

import { useSearchParams } from "next/navigation";
import type { JobStub } from "@/types";

/**
 * 「どこから来たか」を着地後も残す。移動の理由が消えないようにするための表示。
 *
 * output: "export" ではサーバー側で searchParams を読めないため、
 * クライアントで useSearchParams を使う（呼び出し側で <Suspense> に包むこと）。
 * 全職業の名前をクライアントに送らないよう、必要なスタブだけを props で受け取る。
 */
export function FromNote({ candidates }: { candidates: JobStub[] }) {
  const fromSlug = useSearchParams().get("from");
  if (!fromSlug) return null;

  const from = candidates.find((c) => c.slug === fromSlug);
  if (!from) return null;

  return (
    <p className="mt-2 px-4 text-center text-sm text-[var(--muted)] sm:px-0">
      {from.emoji} {from.nameJa} から辿ってきました
    </p>
  );
}
