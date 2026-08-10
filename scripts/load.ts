import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { FACET_IDS, type Facet, type Job, type JobFile, type Tag, type TagFile } from "../src/types";

/**
 * 手書きソースの読み込み。
 * scripts/ は静的importではなく fs で読む（build-data.ts がファイルを追加・整形するため、
 * 実行時に「今ディスク上にあるもの」を見る必要がある）。
 */

export const DATA_DIR = join(process.cwd(), "src", "data");
export const JOBS_DIR = join(DATA_DIR, "jobs");
export const TAXONOMY_DIR = join(DATA_DIR, "taxonomy");
export const TAGS_DIR = join(TAXONOMY_DIR, "tags");
export const GENERATED_DIR = join(DATA_DIR, "generated");

export interface LoadedJob {
  job: Job;
  /** どのファイルから来たか。エラー報告に使う。 */
  file: string;
}

export interface LoadedTag {
  tag: Tag;
  file: string;
}

export interface SourceData {
  facets: Facet[];
  tags: LoadedTag[];
  jobs: LoadedJob[];
  /** ファイル名 -> パース済み内容。build-data.ts の整形書き戻しに使う。 */
  jobFiles: Map<string, JobFile>;
  tagFiles: Map<string, TagFile>;
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function listJson(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort();
}

export function loadSourceData(): SourceData {
  const facets = readJson<Facet[]>(join(TAXONOMY_DIR, "facets.json"));

  const tags: LoadedTag[] = [];
  const tagFiles = new Map<string, TagFile>();
  for (const name of listJson(TAGS_DIR)) {
    const parsed = readJson<TagFile>(join(TAGS_DIR, name));
    tagFiles.set(name, parsed);
    for (const tag of parsed.tags) tags.push({ tag, file: `tags/${name}` });
  }

  const jobs: LoadedJob[] = [];
  const jobFiles = new Map<string, JobFile>();
  for (const name of listJson(JOBS_DIR)) {
    const parsed = readJson<JobFile>(join(JOBS_DIR, name));
    jobFiles.set(name, parsed);
    for (const job of parsed.jobs) jobs.push({ job, file: `jobs/${name}` });
  }

  return { facets, tags, jobs, jobFiles, tagFiles };
}

export function facetOrder(facets: Facet[]): Map<string, number> {
  return new Map(facets.map((f) => [f.id, f.order]));
}

export function assertFacetsWellFormed(facets: Facet[]): string[] {
  const errors: string[] = [];
  const ids = new Set(facets.map((f) => f.id));
  for (const id of FACET_IDS) {
    if (!ids.has(id)) errors.push(`facets.json に軸 "${id}" の定義がない`);
  }
  if (facets.length !== FACET_IDS.length) {
    errors.push(
      `facets.json の軸数が ${facets.length} 件。types/index.ts の FACET_IDS は ${FACET_IDS.length} 件`,
    );
  }
  return errors;
}
