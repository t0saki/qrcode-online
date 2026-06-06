export type Theme = "auto" | "light" | "dark";

const KEY = "qro.theme";
const ORDER: Theme[] = ["auto", "light", "dark"];
const listeners = new Set<(theme: Theme) => void>();

let current: Theme = read();

function read(): Theme {
  const saved = localStorage.getItem(KEY);
  return saved === "light" || saved === "dark" || saved === "auto" ? saved : "auto";
}

function apply(theme: Theme): void {
  const root = document.documentElement;
  if (theme === "auto") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
}

export function initTheme(): void {
  apply(current);
}

export function getTheme(): Theme {
  return current;
}

export function setTheme(theme: Theme): void {
  current = theme;
  localStorage.setItem(KEY, theme);
  apply(theme);
  for (const fn of listeners) fn(theme);
}

export function cycleTheme(): Theme {
  const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length]!;
  setTheme(next);
  return next;
}

export function onThemeChange(fn: (theme: Theme) => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
