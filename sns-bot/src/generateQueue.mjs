// job-world の職業データ（src/data/jobs/*.json）から投稿キューを生成する。
// 冪等: 既に tweet.jsonl にある official_url は再追加しない（新規追加のみ）。

import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BOT_ROOT = path.resolve(HERE, '..');
const JOBS_DIR = path.resolve(BOT_ROOT, '..', 'src', 'data', 'jobs');
const QUEUE_FILE = path.join(BOT_ROOT, 'tweet.jsonl');

const SITE_URL = (process.env.JOB_WORLD_SITE_URL || 'https://job.antonbase.com').replace(/\/+$/, '');
const HASHTAGS = process.env.JOB_HASHTAGS || '#珍しい仕事 #しごと図鑑';
// X は URL を23文字として数える。ヘッダー+タグ+余白を引いた本文上限。
const TWEET_BODY_MAX = 200;

function truncate(text, max) {
  if (!text) return '';
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

function buildEntry(job, industry) {
  const body = [job.summaryJa, job.surpriseJa].filter(Boolean).join('\n\n');
  return {
    type: 'job',
    exam: job.nameJa,
    tweet: truncate(body, TWEET_BODY_MAX),
    category: `しごと図鑑/${industry}`,
    official_url: `${SITE_URL}/jobs/${job.slug}`,
    hashtags: HASHTAGS,
  };
}

function main() {
  const existing = [];
  if (existsSync(QUEUE_FILE)) {
    for (const line of readFileSync(QUEUE_FILE, 'utf8').split('\n')) {
      const t = (line || '').trim();
      if (!t) continue;
      try { existing.push(JSON.parse(t)); } catch { /* skip */ }
    }
  }
  const seen = new Set(existing.map((e) => e.official_url));

  let added = 0;
  const files = readdirSync(JOBS_DIR).filter((f) => f.endsWith('.json'));
  for (const file of files) {
    const data = JSON.parse(readFileSync(path.join(JOBS_DIR, file), 'utf8'));
    const industry = data.industry || path.basename(file, '.json');
    for (const job of data.jobs || []) {
      if (!job || !job.slug) continue;
      const url = `${SITE_URL}/jobs/${job.slug}`;
      if (seen.has(url)) continue;
      existing.push(buildEntry(job, industry));
      seen.add(url);
      added++;
    }
  }

  writeFileSync(QUEUE_FILE, existing.map((e) => JSON.stringify(e)).join('\n') + '\n', 'utf8');
  console.log(`Queue updated. ${added} new posts added. Total: ${existing.length}`);
}

main();
