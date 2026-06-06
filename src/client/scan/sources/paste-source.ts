import { h } from "../../dom";
import { t } from "../../i18n/i18n";
import { icon } from "../../ui/icon";
import { decodeAndReport, type ScanReport, type ScanSource } from "../source";

export function createPasteSource(report: ScanReport): ScanSource {
  const isMac = /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent);
  const key = isMac ? "⌘V" : "Ctrl+V";

  const zone = h(
    "div",
    { class: "dropzone paste-zone", tabindex: "0" },
    icon("clipboard", { size: 30, class: "dropzone-glyph" }),
    h("p", {}, t("scan.paste.hint", { key })),
  );

  const onPaste = (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const blob = item.getAsFile();
        if (blob) {
          e.preventDefault();
          void decodeAndReport(blob, report);
          return;
        }
      }
    }
  };

  return {
    el: h("div", { class: "scan-source" }, zone),
    activate: () => window.addEventListener("paste", onPaste),
    deactivate: () => window.removeEventListener("paste", onPaste),
  };
}
