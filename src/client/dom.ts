/** Minimal hyperscript helpers — no virtual DOM, just terse element creation. */

export type Child = Node | string | number | null | undefined | boolean | Child[];

export type Props = Record<string, unknown> & {
  class?: string;
  style?: string | Partial<CSSStyleDeclaration>;
  dataset?: Record<string, string>;
  ref?: (el: never) => void;
  html?: string;
};

const SVG_NS = "http://www.w3.org/2000/svg";

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props?: Props | null,
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (props) applyProps(el, props);
  appendChildren(el, children);
  return el;
}

export function svg<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs?: Record<string, string | number | boolean | null | undefined> | null,
  ...children: Child[]
): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag);
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      if (value == null || value === false) continue;
      el.setAttribute(key, value === true ? "" : String(value));
    }
  }
  appendChildren(el, children);
  return el;
}

export function clear(el: Element): void {
  el.replaceChildren();
}

export function mount(parent: Element, ...children: Child[]): void {
  clear(parent);
  appendChildren(parent, children);
}

function applyProps(el: HTMLElement, props: Props): void {
  for (const [key, value] of Object.entries(props)) {
    if (value == null || value === false) continue;

    if (key === "class" || key === "className") {
      el.className = String(value);
    } else if (key === "style") {
      if (typeof value === "string") el.setAttribute("style", value);
      else Object.assign(el.style, value);
    } else if (key === "dataset") {
      Object.assign(el.dataset, value as Record<string, string>);
    } else if (key === "html") {
      el.innerHTML = String(value);
    } else if (key === "ref" && typeof value === "function") {
      (value as (e: HTMLElement) => void)(el);
    } else if (key.startsWith("on") && typeof value === "function") {
      el.addEventListener(key.slice(2).toLowerCase(), value as EventListener);
    } else if (key in el && !ATTR_ONLY.has(key)) {
      try {
        (el as unknown as Record<string, unknown>)[key] = value;
      } catch {
        el.setAttribute(key, String(value));
      }
    } else {
      el.setAttribute(key, value === true ? "" : String(value));
    }
  }
}

// Properties that must be set as attributes for correct behavior.
const ATTR_ONLY = new Set(["list", "form", "role"]);

function appendChildren(el: Node, children: Child[]): void {
  for (const child of children) {
    if (child == null || child === false || child === true) continue;
    if (Array.isArray(child)) {
      appendChildren(el, child);
    } else if (child instanceof Node) {
      el.appendChild(child);
    } else {
      el.appendChild(document.createTextNode(String(child)));
    }
  }
}
