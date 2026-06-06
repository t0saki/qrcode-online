import { en } from "./locales/en";
import { zh } from "./locales/zh";

export type Dict = typeof en;
export type Locale = "en" | "zh";
export type StringKey = keyof Dict;

const DICTS: Record<Locale, Record<StringKey, string>> = { en, zh };
const KEY = "qro.lang";
const listeners = new Set<() => void>();

let current: Locale = detect();

function detect(): Locale {
  const saved = localStorage.getItem(KEY);
  if (saved === "en" || saved === "zh") return saved;
  return navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
}

/** Translate a key, with optional `{var}` interpolation. */
export function t(key: StringKey, vars?: Record<string, string | number>): string {
  let s = DICTS[current][key] ?? en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return s;
}

export function getLocale(): Locale {
  return current;
}

export function setLocale(locale: Locale): void {
  current = locale;
  localStorage.setItem(KEY, locale);
  document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
  for (const fn of listeners) fn();
}

export function toggleLocale(): void {
  setLocale(current === "en" ? "zh" : "en");
}

export function onLocaleChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function initI18n(): void {
  document.documentElement.lang = current === "zh" ? "zh-CN" : "en";
}
