import type { Metadata } from "next";
import Link from "next/link";
import { getAllJobs } from "@/lib/data";
import { RARITY_LABEL } from "@/lib/labels";

export const metadata: Metadata = {
  title: "すべての仕事",
  description: "この図鑑に載っている仕事の一覧。",
  alternates: { canonical: "/jobs" },
};

export default function JobsPage() {
  const jobs = getAllJobs();

  return (
    <div>
      <h1 className="text-3xl font-bold">すべての仕事</h1>
      <p className="mt-2 text-[var(--muted)]">{jobs.length} 件</p>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {jobs.map((job) => (
          <li key={job.slug}>
            <Link
              href={`/jobs/${job.slug}`}
              className="block h-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors hover:border-[var(--accent)]"
            >
              <div className="flex items-baseline gap-2">
                <span aria-hidden="true" className="text-xl">
                  {job.emoji}
                </span>
                <span className="font-semibold">{job.nameJa}</span>
              </div>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {job.summaryJa}
              </p>
              <p className="mt-2 text-xs text-[var(--muted)]">
                {RARITY_LABEL[job.rarity]}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
