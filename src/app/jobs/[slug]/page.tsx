import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAllJobs,
  getFacets,
  getGraphHealth,
  getJobBySlug,
  getJobTagsByFacet,
  getNeighborEntry,
} from "@/lib/data";
import { toEgoCenter, toEgoNodes } from "@/lib/view";
import { NeighborList } from "@/components/NeighborList";
import { EgoNetwork } from "@/components/EgoNetwork";
import { FromNote } from "@/components/FromNote";
import { Trail } from "@/components/Trail";
import { RARITY_LABEL, FAMILIARITY_LABEL } from "@/lib/labels";
import { shikakuLinkForJob } from "@/lib/shikaku";

export function generateStaticParams() {
  return getAllJobs().map((job) => ({ slug: job.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const job = getJobBySlug(slug);
  if (!job) return {};
  const commonSearchAlias = job.aliasesJa.find(
    (alias) => alias === "ひよこ鑑定士" || alias === "眼鏡作製技能士",
  );
  const seoName = commonSearchAlias ? `${job.nameJa}（${commonSearchAlias}）` : job.nameJa;
  return {
    title: `${seoName}とは｜仕事内容・なり方ガイド`,
    description: `${job.summaryJa} ${job.surpriseJa}`.slice(0, 120),
    alternates: { canonical: `/jobs/${job.slug}` },
    openGraph: {
      type: "article",
      title: `${seoName}とは｜仕事内容・なり方ガイド`,
      description: job.summaryJa,
      images: [
        { url: `/og/${job.slug}.png`, width: 1200, height: 630, alt: job.nameJa },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: "@shikaku_catalog",
      creator: "@shikaku_catalog",
      title: `${seoName}とは｜仕事内容・なり方ガイド`,
      description: job.summaryJa,
      images: [`/og/${job.slug}.png`],
    },
  };
}
