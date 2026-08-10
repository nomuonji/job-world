"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import {
  clearTrail,
  getTrailServerSnapshot,
  getTrailSnapshot,
  subscribeTrail,
} from "@/lib/trail";
import type { EgoCenterView } from "@/lib/view";

/**
 * 画面下部に固定する、通ってきた道。
 *
 * sessionStorage はサーバー側に存在せず、初回HTMLと必ず食い違うので、
 * 外部ストアとして購読する（サーバー側スナップショットは常に空）。
 */
export function Trail({ current }: { current: EgoCenterView }) {
  const trail = useSyncExternalStore(
    subscribeTrail,
    getTrailSnapshot,
    getTrailServerSnapshot,
  );

  if (trail.length === 0) return null;

  // 現在地が末尾に来るよう、重複を除いてつなげる。
  const path = [...trail.filter((t) => t.slug !== current.slug), current];
  const hops = path.length - 1;

  return (
    <div className="sticky bottom-0 z-10 -mx-4 mt-10 border-t border-[var(--border)] bg-[var(--surface)]/95 px-4 py-2 backdrop-blur">
      <div className="flex items-center gap-2">
        <span className="shrink-0 text-xs text-[var(--muted)]">
          {hops >= 3
            ? `${path[0].nameJa}から${hops}歩`
            : "通ってきた道"}
        </span>

        <ol className="flex flex-1 items-center gap-1 overflow-x-auto">
          {path.map((entry, i) => (
            <li key={`${entry.slug}-${i}`} className="flex items-center gap-1">
              {i > 0 && (
                <span aria-hidden="true" className="text-[var(--muted)]">
                  →
                </span>
              )}
              {entry.slug === current.slug ? (
                <span className="shrink-0 rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-sm font-semibold text-[var(--accent)]">
                  {entry.emoji} {entry.nameJa}
                </span>
              ) : (
                <Link
                  href={`/jobs/${entry.slug}`}
                  className="shrink-0 rounded-full px-2 py-0.5 text-sm text-[var(--muted)] hover:text-[var(--accent)]"
                >
                  {entry.emoji} {entry.nameJa}
                </Link>
              )}
            </li>
          ))}
        </ol>

        <button
          type="button"
          onClick={() => clearTrail()}
          className="shrink-0 text-xs text-[var(--muted)] underline hover:text-[var(--accent)]"
        >
          消す
        </button>
      </div>
    </div>
  );
}
