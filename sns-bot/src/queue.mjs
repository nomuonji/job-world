// 投稿キュー（JSONL）とラウンドロビン状態の管理。
// キューはリポジトリにコミット（非秘密）。状態ファイルもコミットして投稿位置を同期する。

import { readFileSync, writeFileSync, existsSync } from 'node:fs';

export function readJsonl(file) {
  if (!existsSync(file)) return [];
  const out = [];
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const t = (line || '').trim();
    if (!t) continue;
    try { out.push(JSON.parse(t)); } catch { /* skip invalid line */ }
  }
  return out;
}

export function groupByCategory(tweets) {
  return tweets.reduce((acc, t) => {
    if (!t.category) return acc;
    const main = String(t.category).split('/')[0];
    (acc[main] = acc[main] || []).push(t);
    return acc;
  }, {});
}

export function loadState(file, categories) {
  let s;
  if (existsSync(file)) {
    try { s = JSON.parse(readFileSync(file, 'utf8')); } catch { /* fallthrough */ }
  }
  if (!s || typeof s !== 'object' || Array.isArray(s)) {
    s = { lastCategoryKey: null, categories: {}, lastUrlDate: null };
  }
  // 旧形式（lastTweetIndex）を新形式（lastIndex）へ移行して正規化
  const normalized = { ...s, categories: {} };
  for (const c of categories) {
    const cur = s.categories?.[c];
    normalized.categories[c] = { lastIndex: cur?.lastIndex ?? cur?.lastTweetIndex ?? -1 };
  }
  if (!('lastUrlDate' in normalized)) normalized.lastUrlDate = null;
  return normalized;
}

export function selectNext(tweets, state) {
  const byCat = groupByCategory(tweets);
  const keys = Object.keys(byCat).sort();
  if (!keys.length) throw new Error('No categories found.');
  const lastIdx = state.lastCategoryKey ? keys.indexOf(state.lastCategoryKey) : -1;
  const catKey = keys[(lastIdx + 1) % keys.length];
  const items = byCat[catKey];
  const catState = state.categories[catKey] || { lastIndex: -1 };
  const idx = (catState.lastIndex + 1) % items.length;
  const post = items[idx];
  const newState = {
    ...state,
    lastCategoryKey: catKey,
    categories: { ...state.categories, [catKey]: { lastIndex: idx } },
  };
  return { post, newState };
}

export function saveState(file, state) {
  writeFileSync(file, JSON.stringify(state, null, 2) + '\n', 'utf8');
}

export function today() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}
