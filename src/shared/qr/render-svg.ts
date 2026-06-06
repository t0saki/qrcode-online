import { clamp, cssColor, type QrMatrix } from "./matrix";
import type { RenderOpts } from "./types";

/** Render a QR matrix to a compact, crisp SVG string (works in Worker + browser). */
export function renderSvg(matrix: QrMatrix, opts: RenderOpts): string {
  const { size } = matrix;
  const margin = opts.margin;
  const dim = size + margin * 2;

  // Merge consecutive dark modules in each row into a single horizontal run.
  let path = "";
  for (let y = 0; y < size; y++) {
    let runStart = -1;
    for (let x = 0; x <= size; x++) {
      const on = x < size && matrix.get(x, y);
      if (on && runStart < 0) {
        runStart = x;
      } else if (!on && runStart >= 0) {
        const w = x - runStart;
        path += `M${runStart + margin} ${y + margin}h${w}v1h-${w}z`;
        runStart = -1;
      }
    }
  }

  const bg =
    opts.light === "transparent"
      ? ""
      : `<rect width="${dim}" height="${dim}" fill="${cssColor(opts.light)}"/>`;
  const logo = opts.logo ? logoMarkup(opts, dim) : "";

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dim} ${dim}" ` +
    `shape-rendering="crispEdges">${bg}<path d="${path}" fill="${cssColor(opts.dark)}"/>${logo}</svg>`
  );
}

function logoMarkup(opts: RenderOpts, dim: number): string {
  const logo = opts.logo!;
  const box = clamp(logo.scale, 0.1, 0.3) * dim;
  const pos = (dim - box) / 2;
  const pad = box * 0.14;
  const backing = opts.light === "transparent" ? "#ffffff" : cssColor(opts.light);
  return (
    `<rect x="${fmt(pos - pad)}" y="${fmt(pos - pad)}" width="${fmt(box + pad * 2)}" ` +
    `height="${fmt(box + pad * 2)}" rx="${fmt(box * 0.16)}" fill="${backing}"/>` +
    `<image x="${fmt(pos)}" y="${fmt(pos)}" width="${fmt(box)}" height="${fmt(box)}" ` +
    `preserveAspectRatio="xMidYMid meet" href="${escapeAttr(logo.href)}"/>`
  );
}

function fmt(n: number): string {
  return Number(n.toFixed(3)).toString();
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}
