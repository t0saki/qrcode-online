import { clamp, cssColor, type QrMatrix } from "../../shared/qr/matrix";
import type { RenderOpts } from "../../shared/qr/types";

/**
 * Draw a QR matrix (and optional center logo) onto a canvas at an integer
 * module scale. Shared by the live preview and PNG export.
 */
export function drawQr(
  canvas: HTMLCanvasElement,
  matrix: QrMatrix,
  opts: RenderOpts,
  targetPx: number,
  logo?: HTMLImageElement | null,
): void {
  const margin = opts.margin;
  const dim = matrix.size + margin * 2;
  const scale = Math.max(1, Math.round(targetPx / dim));
  const edge = dim * scale;

  canvas.width = edge;
  canvas.height = edge;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, edge, edge);

  const transparent = opts.light === "transparent";
  if (!transparent) {
    ctx.fillStyle = cssColor(opts.light);
    ctx.fillRect(0, 0, edge, edge);
  }

  ctx.fillStyle = cssColor(opts.dark);
  for (let y = 0; y < matrix.size; y++) {
    for (let x = 0; x < matrix.size; x++) {
      if (matrix.get(x, y)) {
        ctx.fillRect((x + margin) * scale, (y + margin) * scale, scale, scale);
      }
    }
  }

  if (logo && logo.complete && logo.naturalWidth > 0) {
    const frac = clamp(opts.logo?.scale ?? 0.22, 0.1, 0.3);
    const box = Math.round(frac * edge);
    const pos = Math.round((edge - box) / 2);
    const pad = Math.round(box * 0.14);
    const radius = Math.round(box * 0.18);

    ctx.fillStyle = transparent ? "#ffffff" : cssColor(opts.light);
    ctx.beginPath();
    ctx.roundRect(pos - pad, pos - pad, box + pad * 2, box + pad * 2, radius);
    ctx.fill();

    const ar = logo.naturalWidth / logo.naturalHeight;
    let w = box;
    let hgt = box;
    if (ar > 1) hgt = box / ar;
    else w = box * ar;
    ctx.drawImage(logo, pos + (box - w) / 2, pos + (box - hgt) / 2, w, hgt);
  }
}
