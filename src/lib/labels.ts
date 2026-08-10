import type { Familiarity, Lifecycle, Rarity } from "@/types";

/**
 * 数値をそのまま出しても意味が伝わらないので、日本語の言い回しに落とす。
 * 基準の定義は src/data/taxonomy/rubric.json 側にある。
 */

export const RARITY_LABEL: Record<Rarity, string> = {
  1: "どの街にもいる",
  2: "意識しないと会わない",
  3: "業界に近づかないと会わない",
  4: "全国で数百人規模",
  5: "全国で数十人規模",
};

export const FAMILIARITY_LABEL: Record<Familiarity, string> = {
  1: "業界の外では通じない名前",
  2: "名前としては知られていない",
  3: "見たことがある人はいる",
  4: "多くの人が名前を知っている",
  5: "子どもでも知っている",
};

export const LIFECYCLE_LABEL: Record<Lifecycle, string> = {
  traditional: "古くから続く",
  established: "定着している",
  emerging: "生まれたばかり",
  declining: "減りつつある",
};
