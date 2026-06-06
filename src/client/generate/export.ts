import { encodeMatrix } from "../../shared/qr/encode";
import { renderSvg } from "../../shared/qr/render-svg";
import type { RenderOpts } from "../../shared/qr/types";
import { loadImage } from "../util";
import { drawQr } from "./draw";
import type { GenState } from "./gen-store";

function optsFor(state: GenState): RenderOpts {
  return {
    margin: state.margin,
    dark: state.dark,
    light: state.light,
    size: state.size,
    logo: state.logo ? { href: state.logo, scale: 0.22 } : undefined,
  };
}

export function svgString(state: GenState): string {
  return renderSvg(encodeMatrix(state.data, state.ecc), optsFor(state));
}

export function svgBlob(state: GenState): Blob {
  return new Blob([svgString(state)], { type: "image/svg+xml;charset=utf-8" });
}

/** PNG export via canvas — composites the logo and supports transparency. */
export async function pngBlob(state: GenState): Promise<Blob> {
  const matrix = encodeMatrix(state.data, state.ecc);
  const canvas = document.createElement("canvas");
  let logo: HTMLImageElement | null = null;
  if (state.logo) {
    try {
      logo = await loadImage(state.logo);
    } catch {
      /* skip logo on failure */
    }
  }
  drawQr(canvas, matrix, optsFor(state), state.size, logo);
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("PNG export failed"))), "image/png");
  });
}

/** A filesystem-safe filename stem derived from the data. */
export function filenameStem(state: GenState): string {
  const base = state.data.replace(/^https?:\/\//, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 32);
  return base ? `qr-${base.toLowerCase()}` : "qrcode";
}
