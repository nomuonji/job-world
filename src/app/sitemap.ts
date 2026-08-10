import type { MetadataRoute } from "next";
import { SITE_URL } from "./layout";
import { getAllJobs, getAllTags, getFacets } from "@/lib/data";

// 静的エクスポートでは sitemap も静的に生成する必要がある。
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = ["", "/jobs", "/facets", "/stats", "/about"];

  return [
    ...staticPaths.map((path) => ({
      url: `${SITE_URL}${path}`,
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.8,
    })),
    ...getAllJobs().map((job) => ({
      url: `${SITE_URL}/jobs/${job.slug}`,
      lastModified: job.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
    ...getFacets().map((facet) => ({
      url: `${SITE_URL}/facets/${facet.id}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...getAllTags().map((tag) => ({
      url: `${SITE_URL}/tags/${tag.facet}/${tag.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
