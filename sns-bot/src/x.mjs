// X（Twitter）API v2 への投稿クライアント（OAuth 1.0a・ゼロ依存）。

import { buildOAuthHeader } from './oauth1.mjs';

const TWEET_URL = 'https://api.twitter.com/2/tweets';

export async function postToX(text, creds) {
  const x = creds?.x;
  if (!x) throw new Error('credentials に x が見つかりません');
  const authHeader = buildOAuthHeader(
    { consumerKey: x.consumer_key, consumerSecret: x.consumer_secret, accessToken: x.access_token, accessTokenSecret: x.access_token_secret },
    'POST',
    TWEET_URL
  );
  const res = await fetch(TWEET_URL, {
    method: 'POST',
    headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.data) {
    throw new Error(`X API error ${res.status}: ${JSON.stringify(json)}`);
  }
  return json.data.id;
}
