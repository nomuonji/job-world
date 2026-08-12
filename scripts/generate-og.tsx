import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import type { ReactElement } from "react";

/**
 * OGP画像のビルド時生成。
 * next/og の opengraph-image ルートは output:export で1枚あたり60秒超の
 * タイムアウトが起きたため、静的PNGを public/og/ に事前生成し、
 * metadata.openGraph.images から参照する方式にしている。
 */

export const OG_SIZE = { width: 1200, height: 630 };
const BASE = process.cwd();

export function ogFonts() {
  const read = (name: string) =>
    readFileSync(join(BASE, "src", "fonts", name)).buffer;
  return [
    { name: "NotoSansJP", data: read("og-font-regular.ttf"), weight: 400 as const, style: "normal" as const },
    { name: "NotoSansJP", data: read("og-font-bold.ttf"), weight: 700 as const, style: "normal" as const },
  ];
}

export async function renderOg(element: ReactElement): Promise<Buffer> {
  const response = new ImageResponse(element, {
    ...OG_SIZE,
    fonts: ogFonts(),
  });
  return Buffer.from(await response.arrayBuffer());
}

/** 深夜の地図を基調にしたファセット7色（ダークテーマの明るい側）。 */
const FACET_COLORS = [
  "#5ec3a8",
  "#d99a5b",
  "#e8768f",
  "#b98ce0",
  "#7ba7e8",
  "#cbb254",
  "#a3abbd",
];

/** slug から決定的に1色選ぶ。職業ごとに色が変わり、同一URLでは変わらない。 */
export function colorFor(slug: string): string {
  let h = 0;
  for (const c of slug) h = (h * 31 + c.charCodeAt(0)) | 0;
  return FACET_COLORS[Math.abs(h) % FACET_COLORS.length];
}

const NAVY_BG = "#12141c";
const SURFACE = "#1a1d28";
const FG = "#e8e9ef";
const MUTED = "#9aa0b4";
const ACCENT = "#8fb0ff";

interface OgCardProps {
  color: string;
  nameJa: string;
  nameEn?: string;
  summaryJa?: string;
  label?: string;
}

/** 共通レイアウト。文字だけで組む（絵文字はサトリで色が出ないため使わない）。 */
export function OgCard({ color, nameJa, nameEn, summaryJa, label }: OgCardProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: `radial-gradient(1200px 630px at 85% -20%, ${SURFACE} 0%, ${NAVY_BG} 65%)`,
        color: FG,
        fontFamily: "NotoSansJP",
        padding: "56px 64px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 9999,
            background: color,
            opacity: 0.9,
          }}
        />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: 2 }}>
            しごと図鑑
          </div>
          <div style={{ fontSize: 12, color: MUTED, letterSpacing: 4 }}>
            JOB WORLD
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          flex: 1,
          gap: 20,
        }}
      >
        {label ? (
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              color,
              letterSpacing: 3,
            }}
          >
            {label}
          </div>
        ) : null}
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            lineHeight: 1.2,
            textWrap: "balance",
          }}
        >
          {nameJa}
        </div>
        {nameEn ? (
          <div style={{ fontSize: 30, color: ACCENT, fontWeight: 400 }}>
            {nameEn}
          </div>
        ) : null}
        {summaryJa ? (
          <div style={{ fontSize: 26, color: MUTED, lineHeight: 1.6, maxWidth: 860 }}>
            {summaryJa}
          </div>
        ) : null}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          borderTop: `1px solid ${color}55`,
          paddingTop: 20,
        }}
      >
        <div style={{ fontSize: 16, color: MUTED }}>
          知っている仕事から、名前も知らなかった仕事へ。
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: FG, letterSpacing: 1 }}>
          job.antonbase.com
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 実行部：public/og/*.png を生成
// ---------------------------------------------------------------------------

interface JobLike {
  slug: string;
  nameJa: string;
  nameEn?: string;
  summaryJa?: string;
}

const JOBS_DIR = join(BASE, "src", "data", "jobs");
const OUT_DIR = join(BASE, "public", "og");

async function main() {
  const jobs: JobLike[] = [];
  for (const f of readdirSync(JOBS_DIR).filter((x) => x.endsWith(".json"))) {
    const data = JSON.parse(readFileSync(join(JOBS_DIR, f), "utf8"));
    jobs.push(...data.jobs);
  }

  mkdirSync(OUT_DIR, { recursive: true });

  const defaultImage = await renderOg(
    <OgCard
      color={colorFor("top")}
      nameJa="しごと図鑑"
      nameEn="Job World — a map of work you'd never meet in everyday life"
      summaryJa="舞台・扱うもの・動作・感覚など7つの角度で職業をつなぐ図鑑。知っている仕事から辿ると、名前も知らなかった仕事に行き着きます。"
    />,
  );
  writeFileSync(join(OUT_DIR, "default.png"), defaultImage);
  console.log(`generated public/og/default.png (${defaultImage.length} bytes)`);

  for (const job of jobs) {
    const img = await renderOg(
      <OgCard
        color={colorFor(job.slug)}
        nameJa={job.nameJa}
        nameEn={job.nameEn}
        summaryJa={job.summaryJa}
      />,
    );
    writeFileSync(join(OUT_DIR, `${job.slug}.png`), img);
  }
  console.log(`generated ${jobs.length} job images`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
