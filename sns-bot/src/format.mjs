// 職業投稿のテキスト整形。URL は必ず含める（job.antonbase.com への導線）。

export function formatPost(t) {
  const parts = [];
  if (t.exam) parts.push(`【今日の職業】${t.exam}`);
  if (t.tweet) parts.push(t.tweet);
  if (t.official_url) parts.push(`🔗 ${t.official_url}`);
  if (t.hashtags) parts.push(t.hashtags);
  return parts.join('\n\n');
}

export function isUrlPost(t) {
  return !!t.official_url;
}
