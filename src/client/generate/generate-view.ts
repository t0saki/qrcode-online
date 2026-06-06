import "./generate.css";

import { BOUNDS, ECC_LEVELS, type EccLevel } from "../../shared/qr/types";
import { h } from "../dom";
import { addHistory } from "../history/history-store";
import { t } from "../i18n/i18n";
import { colorField } from "../ui/color-field";
import { icon } from "../ui/icon";
import { rangeField } from "../ui/range";
import { segmented } from "../ui/segmented";
import { toast } from "../ui/toast";
import { copyImage, copyText, download, fileToScaledDataUrl } from "../util";
import type { ViewHandle } from "../view";
import { embedImgTag, embedUrl } from "./embed-link";
import { filenameStem, pngBlob, svgBlob } from "./export";
import { genStore, type GenState } from "./gen-store";
import { createPreview } from "./live-preview";

export function createGenerateView(): ViewHandle {
  const state = () => genStore.get();
  const preview = createPreview();
  const record = () => addHistory({ type: "generate", value: state().data });

  // ---- Content ----
  const textarea = h("textarea", {
    class: "textarea",
    rows: "3",
    placeholder: t("gen.input.placeholder"),
    spellcheck: "false",
    "aria-label": t("gen.input.label"),
  }) as HTMLTextAreaElement;
  textarea.value = state().data;
  textarea.addEventListener("input", () => genStore.set({ data: textarea.value }));

  // ---- ECC ----
  const eccSeg = segmented({
    options: ECC_LEVELS.map((l) => ({ value: l, label: l })),
    value: state().ecc,
    ariaLabel: t("gen.ecc"),
    onChange: (v) => genStore.set({ ecc: v as EccLevel }),
  });
  eccSeg.el.classList.add("segmented-block");

  // ---- Sliders ----
  const sizeField = rangeField({
    label: t("gen.size"),
    min: BOUNDS.size.min,
    max: BOUNDS.size.max,
    step: BOUNDS.size.step,
    value: state().size,
    format: (v) => `${v}px`,
    onInput: (v) => genStore.set({ size: v }),
  });
  const marginField = rangeField({
    label: t("gen.margin"),
    min: BOUNDS.margin.min,
    max: BOUNDS.margin.max,
    step: 1,
    value: state().margin,
    onInput: (v) => genStore.set({ margin: v }),
  });

  // ---- Colors ----
  const fgField = colorField({
    label: t("gen.color.fg"),
    value: state().dark,
    onChange: (v) => genStore.set({ dark: v }),
  });
  const bgField = colorField({
    label: t("gen.color.bg"),
    value: state().light,
    allowTransparent: true,
    onChange: (v) => genStore.set({ light: v }),
  });

  // ---- Logo ----
  const logoInput = h("input", { type: "file", accept: "image/*", class: "sr-only" }) as HTMLInputElement;
  logoInput.addEventListener("change", async () => {
    const file = logoInput.files?.[0];
    logoInput.value = "";
    if (!file) return;
    try {
      genStore.set({ logo: await fileToScaledDataUrl(file) });
    } catch {
      toast(t("scan.error"), { icon: "x" });
    }
  });
  const logoThumb = h("span", { class: "logo-thumb", "aria-hidden": "true" });
  const logoRemoveBtn = h(
    "button",
    { type: "button", class: "btn btn-ghost btn-sm", onClick: () => genStore.set({ logo: null }) },
    t("gen.logo.remove"),
  );
  const logoRow = h(
    "div",
    { class: "logo-row" },
    logoInput,
    logoThumb,
    h(
      "button",
      { type: "button", class: "btn btn-subtle btn-sm", onClick: () => logoInput.click() },
      icon("image", { size: 16 }),
      t("gen.logo.add"),
    ),
    logoRemoveBtn,
  );

  // ---- Embed link ----
  const embedInput = h("input", {
    class: "input embed-input",
    readonly: "",
    spellcheck: "false",
    "aria-label": t("gen.embed.title"),
  }) as HTMLInputElement;
  embedInput.addEventListener("focus", () => embedInput.select());
  const copyUrlBtn = h(
    "button",
    {
      type: "button",
      class: "btn btn-subtle btn-sm",
      onClick: async () => {
        if (await copyText(embedUrl(state()))) flash(copyUrlBtn, t("action.copied"));
      },
    },
    icon("link", { size: 16 }),
    h("span", {}, t("gen.embed.copyUrl")),
  );
  const copyImgTagBtn = h(
    "button",
    {
      type: "button",
      class: "btn btn-subtle btn-sm",
      onClick: async () => {
        if (await copyText(embedImgTag(state()))) flash(copyImgTagBtn, t("action.copied"));
      },
    },
    icon("copy", { size: 16 }),
    h("span", {}, t("gen.embed.copyImg")),
  );
  const logoNote = h("p", { class: "hint embed-logo-note", hidden: true }, t("gen.embed.logoNote"));

  // ---- Actions ----
  const dlPngBtn = h(
    "button",
    {
      type: "button",
      class: "btn btn-primary",
      onClick: async () => {
        try {
          download(await pngBlob(state()), `${filenameStem(state())}.png`);
          toast(`${t("action.download")} PNG`, { icon: "download" });
          record();
        } catch {
          toast(t("gen.capacity"), { icon: "x" });
        }
      },
    },
    icon("download", { size: 18 }),
    t("gen.download.png"),
  );
  const dlSvgBtn = h(
    "button",
    {
      type: "button",
      class: "btn btn-ghost",
      onClick: () => {
        try {
          download(svgBlob(state()), `${filenameStem(state())}.svg`);
          toast(`${t("action.download")} SVG`, { icon: "download" });
          record();
        } catch {
          toast(t("gen.capacity"), { icon: "x" });
        }
      },
    },
    icon("download", { size: 18 }),
    t("gen.download.svg"),
  );
  const copyImgBtn = h(
    "button",
    {
      type: "button",
      class: "btn btn-ghost",
      onClick: async () => {
        try {
          const ok = await copyImage(await pngBlob(state()));
          toast(ok ? t("action.copied") : t("action.copyImage"), { icon: ok ? "check" : "copy" });
          if (ok) record();
        } catch {
          toast(t("gen.capacity"), { icon: "x" });
        }
      },
    },
    icon("copy", { size: 18 }),
    t("action.copyImage"),
  );

  // ---- Assemble ----
  const aside = h(
    "aside",
    { class: "gen-aside" },
    h("div", { class: "card qr-card" }, preview.el),
    h("div", { class: "gen-actions" }, dlPngBtn, dlSvgBtn, copyImgBtn),
  );

  const main = h(
    "div",
    { class: "gen-main" },
    card(field(t("gen.input.label"), textarea)),
    card(
      sectionTitle(t("gen.options")),
      field(t("gen.ecc"), eccSeg.el, h("p", { class: "hint" }, t("gen.ecc.hint"))),
      sizeField,
      marginField,
      h("div", { class: "color-grid" }, fgField, bgField),
      field(t("gen.logo"), logoRow),
    ),
    card(
      sectionTitle(t("gen.embed.title")),
      h("p", { class: "hint" }, t("gen.embed.hint")),
      embedInput,
      h("div", { class: "embed-actions" }, copyUrlBtn, copyImgTagBtn),
      logoNote,
    ),
  );

  const el = h("div", { class: "view view-generate" }, h("div", { class: "generate-grid" }, aside, main));

  function sync(s: GenState): void {
    preview.render(s);
    if (document.activeElement !== textarea && textarea.value !== s.data) {
      textarea.value = s.data;
    }
    embedInput.value = embedUrl(s);
    logoNote.hidden = !s.logo;
    logoRemoveBtn.hidden = !s.logo;
    logoThumb.hidden = !s.logo;
    logoThumb.style.backgroundImage = s.logo ? `url("${s.logo}")` : "";
  }

  const unsubscribe = genStore.subscribe(sync);
  sync(state());

  return { el, destroy: () => unsubscribe() };
}

function card(...children: (Node | null)[]): HTMLElement {
  return h("section", { class: "card gen-card" }, ...children);
}

function field(label: string, ...controls: (Node | null)[]): HTMLElement {
  return h("div", { class: "field" }, h("label", { class: "field-label" }, label), ...controls);
}

function sectionTitle(text: string): HTMLElement {
  return h("h2", { class: "section-title" }, text);
}

function flash(btn: HTMLElement, label: string): void {
  if (btn.dataset.flashing) return;
  btn.dataset.flashing = "1";
  const kids = Array.from(btn.childNodes);
  btn.replaceChildren(icon("check", { size: 16 }), document.createTextNode(label));
  btn.classList.add("is-flashed");
  window.setTimeout(() => {
    btn.replaceChildren(...kids);
    btn.classList.remove("is-flashed");
    delete btn.dataset.flashing;
  }, 1300);
}
