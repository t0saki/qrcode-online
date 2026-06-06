import { h } from "../dom";
import { t } from "../i18n/i18n";
import { icon } from "../ui/icon";
import type { ViewHandle } from "../view";

// Placeholder — replaced with the full scanner in a later step.
export function createScanView(): ViewHandle {
  const el = h(
    "div",
    { class: "view view-scan" },
    h(
      "div",
      { class: "empty-state card" },
      icon("scan", { size: 40, class: "empty-glyph" }),
      h("p", {}, t("scan.camera.hint")),
    ),
  );
  return { el };
}
