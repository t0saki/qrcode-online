import { h } from "../dom";
import { icon } from "./icon";

export interface SheetHandle {
  close(): void;
}

/** Open a modal sheet (bottom-sheet on mobile, centered dialog on desktop). */
export function openSheet(opts: { title: string; render: (close: () => void) => Node }): SheetHandle {
  const panel = h("div", { class: "sheet", role: "dialog", "aria-modal": "true", "aria-label": opts.title });
  const overlay = h("div", { class: "sheet-overlay" }, panel);

  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    overlay.classList.remove("is-open");
    document.removeEventListener("keydown", onKey);
    overlay.addEventListener("transitionend", () => overlay.remove(), { once: true });
    window.setTimeout(() => overlay.remove(), 400);
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") close();
  };

  const header = h(
    "div",
    { class: "sheet-header" },
    h("h2", { class: "sheet-title" }, opts.title),
    h("button", { type: "button", class: "icon-btn", "aria-label": "Close", onClick: close }, icon("x", { size: 18 })),
  );

  panel.append(header, opts.render(close));
  overlay.addEventListener("pointerdown", (e) => {
    if (e.target === overlay) close();
  });
  document.addEventListener("keydown", onKey);
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add("is-open"));

  return { close };
}
