import type { JobStub } from "@/types";

/**
 * 通ってきた道。
 *
 * 「自分の世界が広がった」実感は、どこから来たかが見えて初めて生まれる。
 * 静的エクスポートなのでサーバー状態は持てないが、探索は一度の滞在で完結するので
 * sessionStorage で足りる。
 */

const KEY = "job-world:trail";
const MAX = 12;

export type TrailEntry = JobStub;

/** サーバー側と、読み取り不能なときの値。参照を固定しないと再描画が止まらない。 */
const EMPTY: TrailEntry[] = [];

export function readTrail(): TrailEntry[] {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as TrailEntry[]) : EMPTY;
  } catch {
    // プライベートモード等で sessionStorage が使えない場合は軌跡なしで動かす。
    return EMPTY;
  }
}

/*
 * useSyncExternalStore 用の窓口。
 * sessionStorage は React の外にある状態なので、useEffect で読んで setState するより
 * 外部ストアとして購読するほうが素直（hydration 前は必ず空を返せる）。
 * getSnapshot は同じ内容なら同じ参照を返さないと無限再描画になるので、
 * 生の文字列をキーにして結果をキャッシュする。
 */
let cachedRaw: string | null = null;
let cachedValue: TrailEntry[] = EMPTY;
const listeners = new Set<() => void>();

export function subscribeTrail(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

export function getTrailSnapshot(): TrailEntry[] {
  let raw: string | null = null;
  try {
    raw = window.sessionStorage.getItem(KEY);
  } catch {
    return EMPTY;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cachedValue = raw ? (JSON.parse(raw) as TrailEntry[]) : EMPTY;
    } catch {
      cachedValue = EMPTY;
    }
  }
  return cachedValue;
}

export function getTrailServerSnapshot(): TrailEntry[] {
  return EMPTY;
}

function notify(): void {
  for (const listener of listeners) listener();
}

export function pushTrail(entry: TrailEntry): void {
  if (typeof window === "undefined") return;
  try {
    const trail = readTrail();

    // 既に通った職業に戻ってきたら、そこまで巻き戻す。
    // 通った順の全履歴ではなく「出発点からの今の道のり」を出したいので、
    // 往復して同じ名前が何度も並ぶのを防ぐ。「N歩」も実際の距離を指すようになる。
    const seen = trail.findIndex((t) => t.slug === entry.slug);
    if (seen >= 0) {
      window.sessionStorage.setItem(
        KEY,
        JSON.stringify(trail.slice(0, seen + 1)),
      );
    } else {
      window.sessionStorage.setItem(
        KEY,
        JSON.stringify([...trail, entry].slice(-MAX)),
      );
    }
    notify();
  } catch {
    // 保存できなくても探索そのものは成立するので、黙って続ける。
  }
}

export function clearTrail(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(KEY);
    notify();
  } catch {
    // 何もしない。
  }
}
