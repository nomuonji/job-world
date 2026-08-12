// Threads の長期トークンを取得し、期限が近ければリフレッシュして Gist に書き戻す。
// Threads の長期トークンは自分自身をリフレッシュトークンとして使う
// （grant_type=th_refresh_token & access_token=<現在のトークン>）。
// 発行から24時間以上経過していないとリフレッシュできない点に注意。

const REFRESH_BEFORE_DAYS = Number(process.env.REFRESH_BEFORE_DAYS ?? '10');

function needsRefresh(expiresAt) {
  if (!expiresAt) return true;
  const expires = new Date(expiresAt).getTime();
  if (Number.isNaN(expires)) return true;
  const thresholdMs = REFRESH_BEFORE_DAYS * 24 * 60 * 60 * 1000;
  return expires - Date.now() <= thresholdMs;
}

async function refreshToken(currentToken) {
  const url = new URL('https://graph.threads.net/refresh_access_token');
  url.searchParams.set('grant_type', 'th_refresh_token');
  url.searchParams.set('access_token', currentToken);
  const res = await fetch(url);
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.access_token) {
    throw new Error(`Threads token refresh failed: ${JSON.stringify(json)}`);
  }
  return json;
}

/**
 * credentials の threads を返す。期限が近ければリフレッシュして保存する。
 * @param {object} credentials - credStore でロードした認証情報
 * @param {object} credStore   - loadCredentials / saveCredentials
 * @param {boolean} dryRun     - true のときはリフレッシュしても保存しない
 */
export async function getThreadsCredentials(credentials, credStore, dryRun) {
  const threads = credentials.threads;
  if (!threads || !threads.token) {
    throw new Error('credentials に threads.token が見つかりません');
  }

  if (dryRun || !needsRefresh(threads.expires_at)) {
    return { userId: threads.user_id, accessToken: threads.token };
  }

  try {
    const refreshed = await refreshToken(threads.token);
    threads.token = refreshed.access_token;
    threads.expires_at = new Date(Date.now() + (refreshed.expires_in ?? 60 * 24 * 3600) * 1000).toISOString();
    await credStore.saveCredentials(credentials);
    console.log(`[threads] トークンをリフレッシュしました（新期限 ${threads.expires_at}）`);
  } catch (err) {
    console.warn(`[threads] リフレッシュに失敗、現在のトークンで続行: ${err.message}`);
  }

  return { userId: threads.user_id, accessToken: threads.token };
}

export { needsRefresh, refreshToken };
