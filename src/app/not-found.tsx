import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <p className="text-5xl" aria-hidden="true">
        🧭
      </p>
      <h1 className="mt-4 text-2xl font-bold">この道は行き止まりでした</h1>
      <p className="mt-2 text-[var(--muted)]">
        お探しのページは見つかりませんでした。
      </p>
      <Link
        href="/jobs"
        className="mt-6 inline-block text-[var(--accent)] underline"
      >
        すべての仕事から探す →
      </Link>
    </div>
  );
}
