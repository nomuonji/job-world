import Link from "next/link";
import type { DerivedNeighbor } from "@/types";
import { EDGE_KIND_LABEL, EDGE_KIND_REVERSE_LABEL } from "@/lib/graph";
import { getFacet, getJobBySlug } from "@/lib/data";

/**
 * 関連職業のリスト。
 *
 * エゴネットワーク図は装飾であって、意味を運ぶ経路はこのリストが唯一。
 * スクリーンリーダー・キーボード操作・JS無効の全てがここで完結する。
 * 図を消しても3ホップ辿れることが v1 の受け入れ基準に入っている。
 */
export function NeighborList({
  fromSlug,
  neighbors,
}: {
  fromSlug: string;
  neighbors: DerivedNeighbor[];
}) {
  return (
    <ul className="mt-4 grid gap-3 sm:grid-cols-2">
      {neighbors.map((neighbor) => {
        const job = getJobBySlug(neighbor.slug);
        if (!job) return null;
        const facet = getFacet(neighbor.dominantFacet);
        const kindLabel = neighbor.typed
          ? neighbor.typed.direction === "out"
            ? EDGE_KIND_LABEL[neighbor.typed.kind]
            : EDGE_KIND_REVERSE_LABEL[neighbor.typed.kind]
          : null;

        return (
          <li key={neighbor.slug}>
            <Link
              href={`/jobs/${neighbor.slug}?from=${fromSlug}`}
              className="block h-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors hover:border-[var(--accent)]"
            >
              <div className="flex items-baseline gap-2">
                <span aria-hidden="true" className="text-xl">
                  {job.emoji}
                </span>
                <span className="font-semibold">{job.nameJa}</span>
                {kindLabel && (
                  <span className="rounded bg-[var(--accent-soft)] px-1.5 py-0.5 text-xs text-[var(--accent)]">
                    {kindLabel}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {job.summaryJa}
              </p>
              <p className="mt-2 text-xs text-[var(--muted)]">
                {facet && (
                  <span
                    className="mr-1"
                    style={{ color: `var(--facet-${facet.id})` }}
                  >
                    {facet.emoji} {facet.labelJa}
                  </span>
                )}
                {neighbor.reasonJa}
              </p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
