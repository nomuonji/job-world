import Link from "next/link";
import { getJobBySlug } from "@/lib/data";
import type { Job } from "@/types";

/**
 * ガイドが実際に扱っている職業への導線。
 * 名前と一言要約は図鑑のデータをそのまま出し、ガイド側で説明を足さない。
 */
export function RelatedJobs({
  slugs,
  heading = "このガイドに出てくる職業",
}: {
  slugs: string[];
  heading?: string;
}) {
  const jobs = slugs
    .map((slug) => getJobBySlug(slug))
    .filter((job): job is Job => !!job);
  if (jobs.length === 0) return null;

  return (
    <section className="space-y-2">
      <h2 className="text-xl font-bold">{heading}</h2>
      <ul className="grid gap-2 sm:grid-cols-2">
        {jobs.map((job) => (
          <li key={job.slug}>
            <Link
              href={`/jobs/${job.slug}`}
              className="block h-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 transition-colors hover:border-[var(--accent)]"
            >
              <span className="font-semibold">
                <span aria-hidden="true">{job.emoji}</span> {job.nameJa}
              </span>
              <span className="mt-1 block text-sm text-[var(--muted)]">
                {job.summaryJa}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
