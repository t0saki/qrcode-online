import { h } from "../dom";
import { icon, type IconName } from "./icon";

let stack: HTMLElement | null = null;

function container(): HTMLElement {
  if (!stack) {
    stack = h("div", { class: "toast-stack", role: "status", "aria-live": "polite" });
    document.body.appendChild(stack);
  }
  return stack;
}

/** Show a transient toast at the bottom-center of the screen. */
export function toast(message: string, opts: { icon?: IconName; duration?: number } = {}): void {
  const el = h(
    "div",
    { class: "toast" },
    opts.icon ? icon(opts.icon, { size: 18 }) : null,
    h("span", {}, message),
  );
  container().appendChild(el);
  requestAnimationFrame(() => el.classList.add("is-in"));

  const dismiss = () => {
    el.classList.remove("is-in");
    el.classList.add("is-out");
    el.addEventListener("transitionend", () => el.remove(), { once: true });
    window.setTimeout(() => el.remove(), 400);
  };
  window.setTimeout(dismiss, opts.duration ?? 2200);
}
