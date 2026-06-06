import type { ParsedResult } from "../../shared/parse/parse-result";
import { h } from "../dom";
import { t } from "../i18n/i18n";
import { icon } from "../ui/icon";
import { actionsFor, KIND_ICON } from "./actions";

/** Render a decoded QR result into a card with a summary + smart actions. */
export function createResultCard(result: ParsedResult): HTMLElement {
  const actions = actionsFor(result);

  const header = h(
    "div",
    { class: "result-head" },
    h("span", { class: "result-icon" }, icon(KIND_ICON[result.kind], { size: 20 })),
    h(
      "div",
      { class: "result-heading" },
      h("span", { class: "result-kind" }, t(`result.kind.${result.kind}`)),
      h("span", { class: "result-summary" }, summaryOf(result)),
    ),
  );

  const details = detailRows(result);

  const value = h("div", { class: "result-value" }, h("code", {}, result.raw));

  const actionRow = h(
    "div",
    { class: "result-actions" },
    ...actions.map((a) =>
      h(
        "button",
        {
          type: "button",
          class: `btn ${a.primary ? "btn-primary" : "btn-ghost"} btn-sm`,
          onClick: () => a.run(),
        },
        icon(a.icon, { size: 16 }),
        h("span", {}, a.label),
      ),
    ),
  );

  return h(
    "div",
    { class: "card result-card" },
    header,
    details,
    value,
    actionRow,
  );
}

function summaryOf(r: ParsedResult): string {
  switch (r.kind) {
    case "url":
      return r.href;
    case "wifi":
      return r.ssid || r.raw;
    case "contact":
      return r.name || r.tel || r.email || t("result.kind.contact");
    case "geo":
      return `${r.lat}, ${r.lng}`;
    case "email":
      return r.to;
    case "tel":
      return r.number;
    case "sms":
      return r.number;
    case "event":
      return r.summary || t("result.kind.event");
    case "text":
      return r.text.length > 80 ? `${r.text.slice(0, 80)}…` : r.text;
  }
}

function detailRows(r: ParsedResult): HTMLElement | null {
  const rows: [string, string][] = [];
  if (r.kind === "wifi") {
    if (r.auth) rows.push(["auth", r.auth === "NOPASS" ? "Open" : r.auth]);
    if (r.password) rows.push(["password", r.password]);
    if (r.hidden) rows.push(["hidden", "yes"]);
  } else if (r.kind === "contact") {
    if (r.tel) rows.push(["tel", r.tel]);
    if (r.email) rows.push(["email", r.email]);
    if (r.org) rows.push(["org", r.org]);
  } else if (r.kind === "event") {
    if (r.start) rows.push(["start", r.start]);
    if (r.location) rows.push(["location", r.location]);
  } else if (r.kind === "email") {
    if (r.subject) rows.push(["subject", r.subject]);
  }
  if (!rows.length) return null;
  return h(
    "dl",
    { class: "result-details" },
    ...rows.flatMap(([k, v]) => [h("dt", {}, k), h("dd", {}, v)]),
  );
}
