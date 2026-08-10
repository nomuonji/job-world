/**
 * URL の検索文字列を React の外部ストアとして扱う。
 *
 * 静的エクスポートでは router.replace が同一ページの検索文字列を更新せず、
 * useSearchParams を使うと Suspense 境界がプリレンダリングで fallback を返して
 * 図が初期HTMLから消える。そこで window.location を直接読み書きし、
 * 変更を自前で通知する。
 */

const listeners = new Set<() => void>();

export function subscribeQuery(onChange: () => void): () => void {
  listeners.add(onChange);
  window.addEventListener("popstate", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("popstate", onChange);
  };
}

/** 文字列（プリミティブ）を返すので、参照の同一性を気にしなくてよい。 */
export function readQueryParam(key: string): string | null {
  return new URLSearchParams(window.location.search).get(key);
}

/** サーバー側では常に未選択。hydration 前後で同じ絵になる。 */
export function serverQueryParam(): null {
  return null;
}

/** 履歴を積まずに検索文字列を差し替える（共有可能なURLは保つ）。 */
export function replaceQueryParam(
  pathname: string,
  key: string,
  value: string | null,
): void {
  const params = new URLSearchParams(window.location.search);
  if (value) params.set(key, value);
  else params.delete(key);
  const query = params.toString();
  window.history.replaceState(null, "", `${pathname}${query ? `?${query}` : ""}`);
  for (const listener of listeners) listener();
}
