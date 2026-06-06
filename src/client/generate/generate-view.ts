import { h } from "../dom";
import { t } from "../i18n/i18n";
import { icon } from "../ui/icon";
import type { ViewHandle } from "../view";

// Placeholder — replaced with the full generator in a later step.
export function createGenerateView(): ViewHandle {
  const el = h(
    "div",
    { class: "view view-generate" },
    h(
      "div",
      { class: "empty-state card" },
      icon("qr-code", { size: 40, class: "empty-glyph" }),
      h("p", {}, t("gen.empty")),
    ),
  );
  return { el };
}
