import { getJobBySlug, getSharedTags } from "@/lib/data";

/**
 * 2つの職業が共有しているタグ。
 * 図鑑の分類上どこが重なるかを並べるだけで、適性や転職の可否は主張しない。
 */
export function SharedTagsNote({ a, b }: { a: string; b: string }) {
  const first = getJobBySlug(a);
  const second = getJobBySlug(b);
  if (!first || !second) return null;
  const shared = getSharedTags(a, b);
  if (shared.length === 0) return null;

  return (
    <section className="space-y-2">
      <h2 className="text-xl font-bold">図鑑の分類では、どこが重なる？</h2>
      <p>
        「{first.nameJa}」と「{second.nameJa}」には、{shared.length}
        個の共通するタグが付いています。同じ要素を持っていても、どこで働くか・何を担当するかは別です。共通点は適性や転職のしやすさを示すものではありません。
      </p>
      <p className="text-sm text-[var(--muted)]">
        共通するタグ: {shared.map((tag) => tag.labelJa).join("、")}
      </p>
    </section>
  );
}
