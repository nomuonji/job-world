// Threads Graph API クライアント（ゼロ依存）。テキスト投稿のみ。
// sns-manager tools/threads/client.js の ESM 移植。

const BASE = 'https://graph.threads.net/v1.0';

async function httpPostForm(url, token, params) {
  const body = new URLSearchParams(params);
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!res.ok) { const e = new Error(`POST ${url} failed: ${res.status}`); e.data = json; throw e; }
  return json;
}

async function getContainerStatus(token, containerId) {
  const url = `${BASE}/${encodeURIComponent(containerId)}?fields=status`;
  const res = await fetch(url, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!res.ok) { const e = new Error(`GET ${url} failed: ${res.status}`); e.data = json; throw e; }
  return json;
}

export async function postText(token, userId, text) {
  const createRes = await httpPostForm(`${BASE}/${encodeURIComponent(userId)}/threads`, token, { text, media_type: 'TEXT' });
  const creationId = createRes.id || createRes.creation_id;
  if (!creationId) throw new Error('No creation_id from create threads');

  const startTime = Date.now();
  while (true) {
    const statusRes = await getContainerStatus(token, creationId);
    if (statusRes.status === 'FINISHED') break;
    if (Date.now() - startTime > 30000) {
      throw new Error(`Container processing timed out: ${statusRes.status || 'unknown status'}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  const publishRes = await httpPostForm(`${BASE}/${encodeURIComponent(userId)}/threads_publish`, token, { creation_id: creationId });
  return { creationId, publishRes };
}
