import type { Job } from "@/types";

export interface ShikakuLink {
  url: string;
  label: string;
}

// しごと図鑑の業界（industry）→ 資格カタログ（shikaku.antonbase.com）のカテゴリURL。
// 資格と仕事の行き来を促すための、業界レベルの粗いマッピング。
const INDUSTRY_TO_SHIKAKU: Record<string, ShikakuLink> = {
  it: { url: "https://shikaku.antonbase.com/docs/technology", label: "IT・技術" },
  science: { url: "https://shikaku.antonbase.com/docs/technology", label: "IT・技術" },
  infrastructure: { url: "https://shikaku.antonbase.com/docs/technology", label: "IT・技術" },
  aerospace: { url: "https://shikaku.antonbase.com/docs/technology", label: "IT・技術" },
  energy: { url: "https://shikaku.antonbase.com/docs/safety-environment", label: "安全・環境" },
  finance: { url: "https://shikaku.antonbase.com/docs/business", label: "ビジネス" },
  retail: { url: "https://shikaku.antonbase.com/docs/business", label: "ビジネス" },
  logistics: { url: "https://shikaku.antonbase.com/docs/business", label: "ビジネス" },
  public: { url: "https://shikaku.antonbase.com/docs/business", label: "ビジネス" },
  medical: { url: "https://shikaku.antonbase.com/docs/medical-welfare", label: "医療・福祉" },
  education: { url: "https://shikaku.antonbase.com/docs/lifestyle", label: "ライフスタイル" },
  craft: { url: "https://shikaku.antonbase.com/docs/lifestyle", label: "ライフスタイル" },
  "food-fermentation": { url: "https://shikaku.antonbase.com/docs/lifestyle", label: "ライフスタイル" },
  nature: { url: "https://shikaku.antonbase.com/docs/lifestyle", label: "ライフスタイル" },
  primary: { url: "https://shikaku.antonbase.com/docs/lifestyle", label: "ライフスタイル" },
  beauty: { url: "https://shikaku.antonbase.com/docs/lifestyle", label: "ライフスタイル" },
  ceremony: { url: "https://shikaku.antonbase.com/docs/lifestyle", label: "ライフスタイル" },
  sports: { url: "https://shikaku.antonbase.com/docs/lifestyle", label: "ライフスタイル" },
  heritage: { url: "https://shikaku.antonbase.com/docs/lifestyle", label: "ライフスタイル" },
  entertainment: { url: "https://shikaku.antonbase.com/docs/creative", label: "クリエイティブ" },
  publishing: { url: "https://shikaku.antonbase.com/docs/creative", label: "クリエイティブ" },
};

const DEFAULT_SHIKAKU_LINK: ShikakuLink = {
  url: "https://shikaku.antonbase.com/docs/intro",
  label: "資格カタログ",
};

export function shikakuLinkForJob(job: Job): ShikakuLink {
  const industryTag = job.tags.find((t) => t.startsWith("industry."));
  const industry = industryTag?.split(".")[1];
  return (industry && INDUSTRY_TO_SHIKAKU[industry]) || DEFAULT_SHIKAKU_LINK;
}
