import "./history.css";

import { parseResult } from "../../shared/parse/parse-result";
import { h, mount } from "../dom";
import { t } from "../i18n/i18n";
import { KIND_ICON, requestGenerate } from "../result/actions";
import { icon, type IconName } from "../ui/icon";
import { toast } from "../ui/toast";
import { copyText } from "../util";
import { clearHistory, listHistory, removeHistory, type HistoryItem } from "./history-store";

/** The content of the history sheet. `close` dismisses the sheet. */
export function renderHistoryPanel(close: () => void): Node {
  const root = h("div", { class: "history-panel" });

  function render(): void {
    const items = listHistory();
    if (!items.length) {
      mount(
        root,
        h("div", { class: "empty-state" }, icon("clock", { size: 34, class: "empty-glyph" }), h("p", {}, t("history.empty"))),
      );
      return;
    }
    mount(
      root,
      h("div", { class: "history-list" }, ...items.map(rowFor)),
      h(
        "div",
        { class: "history-footer" },
        h(
          "button",
          { type: "button", class: "btn btn-ghost btn-sm", onClick: () => { clearHistory(); render(); } },
          icon("trash", { size: 16 }),
          t("history.clear"),
        ),
      ),
    );
  }

  function rowFor(item: HistoryItem): HTMLElement {
    return h(
      "div",
      { class: "history-item" },
      h("span", { class: "history-icon" }, icon(iconFor(item), { size: 18 })),
      h(
        "button",
        {
          type: "button",
          class: "history-main",
          title: t("result.makeQr"),
          onClick: () => {
            requestGenerate(item.value);
            close();
          },
        },
        h("span", { class: "history-value" }, item.value),
        h(
          "span",
          { class: "history-meta" },
          `${item.type === "scan" ? t("history.scanned") : t("history.generated")} · ${relTime(item.ts)}`,
        ),
      ),
      h(
        "button",
        {
          type: "button",
          class: "icon-btn icon-btn-sm",
          title: t("action.copy"),
          "aria-label": t("action.copy"),
          onClick: async () => {
            if (await copyText(item.value)) toast(t("action.copied"), { icon: "check" });
          },
        },
        icon("copy", { size: 16 }),
      ),
      h(
        "button",
        {
          type: "button",
          class: "icon-btn icon-btn-sm",
          title: t("action.clear"),
          "aria-label": t("action.clear"),
          onClick: () => { removeHistory(item.id); render(); },
        },
        icon("x", { size: 16 }),
      ),
    );
  }

  render();
  return root;
}

function iconFor(item: HistoryItem): IconName {
  if (item.type === "generate") return "qr-code";
  const kind = item.kind as keyof typeof KIND_ICON | undefined;
  return (kind && KIND_ICON[kind]) || "scan";
}

function relTime(ts: number): string {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return t("time.now");
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}
