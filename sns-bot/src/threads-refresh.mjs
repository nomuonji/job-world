// Threads の長期トークンを強制リフレッシュして Secret Gist に書き戻す。
// REFRESH_BEFORE_DAYS を大きく（例: 60）設定すると、通常の自動リフレッシュ条件を
// 無視して常にリフレッシュする。

import * as credStore from './credStore.mjs';
import { refreshToken } from './threadsAuth.mjs';

async function main() {
  const creds = await credStore.loadCredentials();
  const threads = creds.threads;
  if (!threads?.token) throw new Error('credentials に threads.token がありません');

  const refreshed = await refreshToken(threads.token);
  threads.token = refreshed.access_token;
  threads.expires_at = new Date(Date.now() + (refreshed.expires_in ?? 60 * 24 * 3600) * 1000).toISOString();
  await credStore.saveCredentials(creds);
  console.log(`Threads token refreshed. New expiry: ${threads.expires_at}`);
}

main().catch((err) => { console.error(err?.message || err); process.exitCode = 1; });
