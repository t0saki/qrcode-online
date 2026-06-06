export interface HistoryItem {
  id: string;
  type: "generate" | "scan";
  value: string;
  kind?: string;
  ts: number;
}

const KEY = "qro.history.v1";
const CAP = 50;
const listeners = new Set<() => void>();

let items = load();

function load(): HistoryItem[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? (parsed as HistoryItem[]) : [];
  } catch {
    return [];
  }
}

function persist(): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* quota — ignore */
  }
  for (const fn of listeners) fn();
}

/** Add an entry (deduped by type+value, newest first, capped). */
export function addHistory(entry: Pick<HistoryItem, "type" | "value" | "kind">): void {
  if (!entry.value.trim()) return;
  items = items.filter((i) => !(i.type === entry.type && i.value === entry.value));
  items.unshift({ ...entry, id: crypto.randomUUID(), ts: Date.now() });
  if (items.length > CAP) items = items.slice(0, CAP);
  persist();
}

export function listHistory(): readonly HistoryItem[] {
  return items;
}

export function removeHistory(id: string): void {
  items = items.filter((i) => i.id !== id);
  persist();
}

export function clearHistory(): void {
  items = [];
  persist();
}

export function onHistoryChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
