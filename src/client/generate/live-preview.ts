import { encodeMatrix, QrCapacityError } from "../../shared/qr/encode";
import type { QrMatrix } from "../../shared/qr/matrix";
import type { RenderOpts } from "../../shared/qr/types";
import { h } from "../dom";
import { t } from "../i18n/i18n";
import { loadImage } from "../util";
import { drawQr } from "./draw";
import type { GenState } from "./gen-store";

const PREVIEW_PX = 720;

export interface PreviewHandle {
  el: HTMLElement;
  render(state: GenState): void;
}

export function createPreview(): PreviewHandle {
  const canvas = h("canvas", { class: "qr-canvas", role: "img" });
  const frame = h("div", { class: "qr-frame" }, canvas);
  const status = h("div", { class: "qr-status", hidden: true });
  const el = h("div", { class: "qr-preview" }, frame, status);

  let logoImg: HTMLImageElement | null = null;
  let logoSrc: string | null = null;
  let last: GenState | null = null;

  function optsFor(state: GenState): RenderOpts {
    return {
      margin: state.margin,
      dark: state.dark,
      light: state.light,
      logo: state.logo ? { href: state.logo, scale: 0.22 } : undefined,
    };
  }

  function showStatus(text: string, tone: "muted" | "error"): void {
    status.hidden = false;
    status.dataset.tone = tone;
    status.textContent = text;
    canvas.style.visibility = "hidden";
  }

  function paint(state: GenState): void {
    if (!state.data.trim()) {
      showStatus(t("gen.empty"), "muted");
      return;
    }
    let matrix: QrMatrix;
    try {
      matrix = encodeMatrix(state.data, state.ecc);
    } catch (err) {
      showStatus(err instanceof QrCapacityError ? t("gen.capacity") : t("scan.error"), "error");
      return;
    }
    status.hidden = true;
    canvas.style.visibility = "visible";
    frame.dataset.transparent = state.light === "transparent" ? "true" : "false";
    canvas.setAttribute("aria-label", `QR code for: ${state.data}`);
    drawQr(canvas, matrix, optsFor(state), PREVIEW_PX, logoSrc === state.logo ? logoImg : null);
  }

  return {
    el,
    render(state) {
      last = state;
      if (state.logo !== logoSrc) {
        logoSrc = state.logo;
        logoImg = null;
        if (state.logo) {
          const src = state.logo;
          loadImage(src)
            .then((img) => {
              if (logoSrc === src && last) {
                logoImg = img;
                paint(last);
              }
            })
            .catch(() => {});
        }
      }
      paint(state);
    },
  };
}
