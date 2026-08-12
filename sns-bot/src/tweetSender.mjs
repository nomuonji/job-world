// X 投稿（職業キューからラウンドロビンで1本選んでツイート）。
// URL 付き投稿は1日1本まで（state の lastUrlDate で制御）。

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as credStore from './credStore.mjs';
import { postToX } from './x.mjs';
import { readJsonl, groupByCategory, loadState, selectNext, saveState, today } from './queue.mjs';
import { formatPost, isUrlPost } from './format.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BOT_ROOT = path.resolve(HERE, '..');
const QUEUE_FILE = path.join(BOT_ROOT, 'tweet.jsonl');
const STATE_FILE = path.join(BOT_ROOT, 'tweet_state.json');

function isDryRun() {
  return process.env.DRY_RUN === '1' || process.argv.includes('--dry-run');
}

async function main() {
  try {
    const tweets = readJsonl(QUEUE_FILE);
    if (!tweets.length) { console.log('No posts to send.'); return; }

    const categories = Object.keys(groupByCategory(tweets));
    const state = loadState(STATE_FILE, categories);
    const { post, newState } = selectNext(tweets, state);
    const text = formatPost(post);

    if (isUrlPost(post) && state.lastUrlDate === today()) {
      console.log(`URL post already sent today (${today()}). Skip.`);
      return;
    }

    const creds = await credStore.loadCredentials();
    if (isDryRun()) {
      console.log('[DRY_RUN] Would tweet with text:');
      console.log(text);
      return; // 状態を進めない
    }

    const id = await postToX(text, creds);
    console.log(`Tweet sent successfully: ${id}`);
    console.log(text);

    const finalState = isUrlPost(post) ? { ...newState, lastUrlDate: today() } : newState;
    saveState(STATE_FILE, finalState);
    console.log('State updated.');
  } catch (err) {
    console.error('Error sending tweet:', err?.message || err);
    process.exitCode = 1;
  }
}

main();
