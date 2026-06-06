import { h, mount } from "./dom";
import { createGenerateView } from "./generate/generate-view";
import { getLocale, onLocaleChange, t, toggleLocale } from "./i18n/i18n";
import { createScanView } from "./scan/scan-view";
import { cycleTheme, getTheme, type Theme } from "./theme";
import { icon, type IconName } from "./ui/icon";
import { segmented } from "./ui/segmented";
import type { ViewHandle } from "./view";

type Mode = "generate" | "scan";

const MODE_KEY = "qro.mode";
export const REPO_URL = "https://github.com/t0saki/qrcode-online";

const THEME_ICON: Record<Theme, IconName> = { auto: "monitor", light: "sun", dark: "moon" };
const THEME_TITLE: Record<Theme, "theme.auto" | "theme.light" | "theme.dark"> = {
  auto: "theme.auto",
  light: "theme.light",
  dark: "theme.dark",
};

/** Mount the app shell, re-rendering on locale change. */
export function mountApp(root: HTMLElement): void {
  let teardown: (() => void) | null = null;
  const render = () => {
    teardown?.();
    const built = buildShell();
    teardown = built.teardown;
    mount(root, built.el);
  };
  onLocaleChange(render);
  render();
}

function buildShell(): { el: HTMLElement; teardown: () => void } {
  let mode = readMode();
  const views: Record<Mode, ViewHandle> = {
    generate: createGenerateView(),
    scan: createScanView(),
  };
  const panes: Record<Mode, HTMLElement> = {
    generate: h("section", { class: "pane", "data-mode": "generate" }, views.generate.el),
    scan: h("section", { class: "pane", "data-mode": "scan" }, views.scan.el),
  };

  const modeSwitch = segmented({
    options: [
      { value: "generate", label: t("mode.generate"), icon: "qr-code" },
      { value: "scan", label: t("mode.scan"), icon: "scan" },
    ],
    value: mode,
    ariaLabel: t("app.name"),
    onChange: (v) => setMode(v as Mode),
  });

  function applyMode(): void {
    (Object.keys(panes) as Mode[]).forEach((m) => panes[m].classList.toggle("is-active", m === mode));
  }

  function setMode(next: Mode): void {
    if (next === mode) return;
    views[mode].deactivate?.();
    mode = next;
    localStorage.setItem(MODE_KEY, mode);
    applyMode();
    modeSwitch.setValue(mode);
    views[mode].activate?.();
  }

  const themeBtn = h("button", { class: "icon-btn", type: "button" });
  const refreshTheme = () => {
    const th = getTheme();
    themeBtn.replaceChildren(icon(THEME_ICON[th], { size: 18 }));
    themeBtn.title = t(THEME_TITLE[th]);
    themeBtn.setAttribute("aria-label", t(THEME_TITLE[th]));
  };
  themeBtn.addEventListener("click", () => {
    cycleTheme();
    refreshTheme();
  });
  refreshTheme();

  const header = h(
    "header",
    { class: "topbar" },
    h(
      "a",
      { class: "brand", href: "/", "aria-label": t("app.name") },
      h("span", { class: "brand-badge" }, icon("qr-code", { size: 18 })),
      h("span", { class: "wordmark" }, "QR"),
    ),
    h("nav", { class: "topbar-center" }, modeSwitch.el),
    h(
      "div",
      { class: "topbar-actions" },
      h(
        "a",
        {
          class: "icon-btn",
          href: REPO_URL,
          target: "_blank",
          rel: "noreferrer",
          title: t("footer.source"),
          "aria-label": t("footer.source"),
        },
        icon("github", { size: 18 }),
      ),
      h(
        "button",
        {
          class: "icon-btn icon-btn-text",
          type: "button",
          title: t("lang.toggle"),
          "aria-label": t("lang.toggle"),
          onClick: () => toggleLocale(),
        },
        getLocale() === "en" ? "中" : "EN",
      ),
      themeBtn,
    ),
  );

  const stage = h("main", { class: "stage" }, panes.generate, panes.scan);
  const footer = h(
    "footer",
    { class: "footer" },
    h("span", {}, t("footer.privacy")),
    h(
      "a",
      { href: REPO_URL, target: "_blank", rel: "noreferrer", class: "footer-link" },
      t("footer.source"),
    ),
  );

  applyMode();
  queueMicrotask(() => views[mode].activate?.());

  const el = h("div", { class: "app-root" }, header, stage, footer);
  const teardown = () => {
    views.generate.deactivate?.();
    views.scan.deactivate?.();
  };
  return { el, teardown };
}

function readMode(): Mode {
  return localStorage.getItem(MODE_KEY) === "scan" ? "scan" : "generate";
}
