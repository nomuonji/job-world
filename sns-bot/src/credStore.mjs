// 認証情報（X OAuth1 / Threads）を Secret Gist から読み書きする。
// 公開リポジトリにトークンをコミットしないための唯一の資格情報ストア。
//
// 必要な環境変数:
//   GH_GIST_TOKEN : gist スコープのみを持つ GitHub PAT（最小権限）
//   GIST_ID       : 状態を保存する Secret Gist の ID
//   GIST_FILENAME : (任意) 既定 "credentials.json"
//   LOCAL_CRED_FILE: (任意・ローカル検証用) 指定するとこのファイルを Gist の代わりに使う

const API = 'https://api.github.com';
const DEFAULT_FILENAME = 'credentials.json';

async function githubRequest(method, url, token, payload) {
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(payload ? { 'Content-Type': 'application/json' } : {}),
    },
    body: payload ? JSON.stringify(payload) : undefined,
  });
  if (!res.ok) {
    throw new Error(`GitHub API ${res.status} ${method} ${url}: ${await res.text()}`);
  }
  return res.json();
}

function localCredPath() {
  return process.env.LOCAL_CRED_FILE || null;
}

export async function loadCredentials() {
  const local = localCredPath();
  if (local) {
    const { readFileSync } = await import('node:fs');
    return JSON.parse(readFileSync(local, 'utf8'));
  }
  const token = process.env.GH_GIST_TOKEN;
  const gistId = process.env.GIST_ID;
  if (!token || !gistId) {
    throw new Error('GH_GIST_TOKEN / GIST_ID が未設定です');
  }
  const gist = await githubRequest('GET', `${API}/gists/${gistId}`, token);
  const file = gist.files?.[process.env.GIST_FILENAME || DEFAULT_FILENAME];
  if (!file) {
    throw new Error(`Gist に ${process.env.GIST_FILENAME || DEFAULT_FILENAME} が見つかりません`);
  }
  return JSON.parse(file.content);
}

export async function saveCredentials(data) {
  const local = localCredPath();
  if (local) {
    const { writeFileSync } = await import('node:fs');
    writeFileSync(local, JSON.stringify(data, null, 2), 'utf8');
    return;
  }
  const token = process.env.GH_GIST_TOKEN;
  const gistId = process.env.GIST_ID;
  if (!token || !gistId) {
    throw new Error('GH_GIST_TOKEN / GIST_ID が未設定です');
  }
  const filename = process.env.GIST_FILENAME || DEFAULT_FILENAME;
  await githubRequest('PATCH', `${API}/gists/${gistId}`, token, {
    files: { [filename]: { content: JSON.stringify(data, null, 2) } },
  });
}
