import { h } from "../dom";
import { t } from "../i18n/i18n";
import { icon } from "./icon";

const HEX6 = /^[0-9a-f]{6}$/;

/** A color control: native swatch + hex text input, with optional transparent. */
export function colorField(opts: {
  label: string;
  value: string; // "rrggbb" | "transparent"
  allowTransparent?: boolean;
  onChange: (value: string) => void;
}): HTMLElement {
  let value = opts.value;
  let lastHex = value === "transparent" ? "ffffff" : value;

  const swatch = h("input", {
    class: "color-swatch",
    type: "color",
    value: `#${lastHex}`,
    "aria-label": opts.label,
  }) as HTMLInputElement;

  const hex = h("input", {
    class: "input color-hex",
    type: "text",
    spellcheck: "false",
    autocapitalize: "off",
    maxlength: "7",
    inputmode: "text",
  }) as HTMLInputElement;

  const transparentBtn = opts.allowTransparent
    ? h(
        "button",
        {
          type: "button",
          class: "color-transparent",
          title: t("gen.color.transparent"),
          "aria-label": t("gen.color.transparent"),
          "aria-pressed": "false",
          onClick: () => setValue(value === "transparent" ? lastHex : "transparent", true),
        },
        icon("x", { size: 16 }),
      )
    : null;

  function reflect(): void {
    const transparent = value === "transparent";
    swatch.disabled = transparent;
    swatch.value = `#${transparent ? lastHex : value}`;
    hex.disabled = transparent;
    hex.value = transparent ? "" : value;
    hex.placeholder = transparent ? t("gen.color.transparent") : "rrggbb";
    if (transparentBtn) transparentBtn.setAttribute("aria-pressed", String(transparent));
    swatch.parentElement?.classList.toggle("is-transparent", transparent);
  }

  function setValue(next: string, emit: boolean): void {
    value = next;
    if (next !== "transparent") lastHex = next;
    reflect();
    if (emit) opts.onChange(value);
  }

  swatch.addEventListener("input", () => setValue(swatch.value.replace(/^#/, "").toLowerCase(), true));
  hex.addEventListener("input", () => {
    let v = hex.value.replace(/^#/, "").toLowerCase();
    if (v.length === 3) v = v.split("").map((c) => c + c).join("");
    if (HEX6.test(v)) setValue(v, true);
  });
  hex.addEventListener("blur", () => reflect());

  reflect();

  return h(
    "div",
    { class: "field color-field" },
    h("label", { class: "field-label" }, opts.label),
    h(
      "div",
      { class: "color-row" },
      h("span", { class: "color-swatch-wrap" }, swatch),
      hex,
      transparentBtn,
    ),
  );
}
