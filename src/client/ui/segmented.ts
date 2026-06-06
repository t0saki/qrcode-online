import { h } from "../dom";
import { icon, type IconName } from "./icon";

export interface SegOption {
  value: string;
  label: string;
  icon?: IconName;
}

export interface SegmentedHandle {
  el: HTMLElement;
  setValue(value: string): void;
}

/** A pill segmented control with a sliding thumb, keyboard + ARIA support. */
export function segmented(opts: {
  options: SegOption[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
  size?: "md" | "lg";
}): SegmentedHandle {
  let value = opts.value;
  const buttons: HTMLButtonElement[] = [];
  const thumb = h("div", { class: "segmented-thumb", "aria-hidden": "true" });

  const indexOf = (v: string) => Math.max(0, opts.options.findIndex((o) => o.value === v));

  function layout(): void {
    const btn = buttons[indexOf(value)];
    if (!btn || btn.offsetWidth === 0) return;
    thumb.style.width = `${btn.offsetWidth}px`;
    thumb.style.height = `${btn.offsetHeight}px`;
    thumb.style.transform = `translate(${btn.offsetLeft}px, ${btn.offsetTop}px)`;
    el.classList.add("is-ready");
  }

  function refresh(): void {
    buttons.forEach((b, i) => {
      const selected = opts.options[i]!.value === value;
      b.setAttribute("aria-checked", String(selected));
      b.tabIndex = selected ? 0 : -1;
      b.classList.toggle("is-active", selected);
    });
    layout();
  }

  function select(next: string, focus: boolean): void {
    if (next === value) return;
    value = next;
    refresh();
    if (focus) buttons[indexOf(value)]?.focus();
    opts.onChange(value);
  }

  opts.options.forEach((option) => {
    const btn = h(
      "button",
      {
        type: "button",
        class: "segmented-option",
        role: "radio",
        "aria-checked": "false",
        onClick: () => select(option.value, true),
        onKeydown: (e: KeyboardEvent) => {
          const i = indexOf(value);
          const n = opts.options.length;
          if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            e.preventDefault();
            select(opts.options[(i + 1) % n]!.value, true);
          } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            e.preventDefault();
            select(opts.options[(i - 1 + n) % n]!.value, true);
          }
        },
      },
      option.icon ? icon(option.icon, { size: 18 }) : null,
      h("span", { class: "segmented-label" }, option.label),
    );
    buttons.push(btn);
  });

  const el = h(
    "div",
    { class: `segmented segmented-${opts.size ?? "md"}`, role: "radiogroup", "aria-label": opts.ariaLabel ?? "" },
    thumb,
    ...buttons,
  );

  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(() => layout()).observe(el);
  }
  refresh();

  return {
    el,
    setValue(v: string) {
      value = v;
      refresh();
    },
  };
}
