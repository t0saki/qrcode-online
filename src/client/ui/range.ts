import { h } from "../dom";

/** A labelled range slider with a live value readout and accent track fill. */
export function rangeField(opts: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  format?: (v: number) => string;
  onInput: (v: number) => void;
}): HTMLElement {
  const fmt = opts.format ?? ((v) => String(v));
  const valueLabel = h("span", { class: "range-value" }, fmt(opts.value));

  const input = h("input", {
    class: "range",
    type: "range",
    min: String(opts.min),
    max: String(opts.max),
    step: String(opts.step),
    value: String(opts.value),
    onInput: (e: Event) => {
      const v = Number((e.target as HTMLInputElement).value);
      valueLabel.textContent = fmt(v);
      setFill(v);
      opts.onInput(v);
    },
  });

  function setFill(v: number): void {
    const pct = ((v - opts.min) / (opts.max - opts.min)) * 100;
    input.style.setProperty("--fill", `${pct}%`);
  }
  setFill(opts.value);

  return h(
    "div",
    { class: "field range-field" },
    h("div", { class: "range-header" }, h("label", { class: "field-label" }, opts.label), valueLabel),
    input,
  );
}
