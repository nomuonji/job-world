// Threads 投稿（職業キューからラウンドロビンで1本選んで投稿）。
// X とは別の state（threads_state.json）を持ち、URL 付き投稿は1日1本まで。

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as credStore from './credStore.mjs';
import { getThreadsCredentials } from './threadsAuth.mjs';
import { postText } from './threadsClient.mjs';
import { readJsonl, groupByCategory, loadState, selectNext, saveState, today } from './queue.mjs';
import { formatPost, isUrlPost } from './format.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BOT_ROOT = path.resolve(HERE, '..');
const QUEUE_FILE = path.join(BOT_ROOT, 'tweet.jsonl');
const STATE_FILE = path.join(BOT_ROOT, 'threads_state.json');

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

    if (isDryRun()) {
      console.log('[DRY_RUN] Would post to Threads with text:');
      console.log(text);
      return; // 状態を進めない
    }

    const creds = await credStore.loadCredentials();
    const { userId, accessToken } = await getThreadsCredentials(creds, credStore, false);
    const res = await postText(accessToken, userId, text);
    console.log(`Threads post success: ${JSON.stringify(res)}`);
    console.log(text);

    const finalState = isUrlPost(post) ? { ...newState, lastUrlDate: today() } : newState;
    saveState(STATE_FILE, finalState);
    console.log('State updated.');
  } catch (err) {
    console.error('Error sending Threads post:', err?.message || err);
    if (err?.data) console.error('Error data:', JSON.stringify(err.data));
    process.exitCode = 1;
  }
}

main();
