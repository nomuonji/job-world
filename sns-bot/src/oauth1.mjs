// OAuth 1.0a HMAC-SHA1 署名（X API v2 用）。
// 外部ライブラリに依存せず、node:crypto だけで署名ヘッダーを生成する。
// whisky-media-jp 09-sns-bot の実装と同一ロジック。

import { createHmac, randomBytes } from 'node:crypto';

function percentEncode(str) {
  return encodeURIComponent(str).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

/**
 * OAuth 1.0a Authorization ヘッダーを生成する。
 * @param {{consumerKey:string, consumerSecret:string, accessToken:string, accessTokenSecret:string}} credentials
 * @param {'GET'|'POST'} method
 * @param {string} url 完全なURL（クエリなし）
 * @param {Record<string,string>} params リクエストパラメータ（署名対象。multipart bodyは含めない）
 */
export function buildOAuthHeader(credentials, method, url, params = {}) {
  const { consumerKey, consumerSecret, accessToken, accessTokenSecret } = credentials;

  const oauth = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: accessToken,
    oauth_version: '1.0',
  };

  const allParams = { ...params, ...oauth };
  const paramString = Object.keys(allParams)
    .sort()
    .map((k) => `${percentEncode(k)}=${percentEncode(allParams[k])}`)
    .join('&');

  const signatureBase = `${method}&${percentEncode(url)}&${percentEncode(paramString)}`;
  const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(accessTokenSecret)}`;
  const signature = createHmac('sha1', signingKey).update(signatureBase).digest('base64');

  const signed = { ...oauth, oauth_signature: signature };
  const headerParts = Object.keys(signed)
    .sort()
    .map((k) => `${percentEncode(k)}="${percentEncode(signed[k])}"`);

  return `OAuth ${headerParts.join(', ')}`;
}
