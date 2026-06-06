import { hexToRgb, type QrMatrix } from "./matrix";
import { chunk, concatBytes } from "./png/chunk";
import { deflate } from "./png/deflate";
import type { RenderOpts } from "./types";

const SIGNATURE = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/**
 * Render a QR matrix to PNG bytes with no canvas — build raw scanlines and zlib
 * them via `CompressionStream`. Uses truecolor RGB, or RGBA when the background
 * is transparent. Integer module scaling keeps every module crisp.
 */
export async function renderPng(matrix: QrMatrix, opts: RenderOpts): Promise<Uint8Array> {
  const margin = opts.margin;
  const dimModules = matrix.size + margin * 2;
  const target = opts.size ?? 256;
  const scale = Math.max(1, Math.floor(target / dimModules));
  const edge = dimModules * scale;

  const [dr, dg, db] = hexToRgb(opts.dark);
  const transparent = opts.light === "transparent";
  const [lr, lg, lb] = transparent ? ([255, 255, 255] as const) : hexToRgb(opts.light);
  const channels = transparent ? 4 : 3;
  const stride = edge * channels;

  // Raw image: each row is 1 filter byte (0 = None) + `stride` color bytes.
  const raw = new Uint8Array((stride + 1) * edge);
  for (let py = 0; py < edge; py++) {
    const my = ((py / scale) | 0) - margin;
    const rowStart = py * (stride + 1);
    raw[rowStart] = 0;
    for (let px = 0; px < edge; px++) {
      const mx = ((px / scale) | 0) - margin;
      const dark =
        mx >= 0 && my >= 0 && mx < matrix.size && my < matrix.size && matrix.get(mx, my);
      const o = rowStart + 1 + px * channels;
      if (dark) {
        raw[o] = dr;
        raw[o + 1] = dg;
        raw[o + 2] = db;
        if (channels === 4) raw[o + 3] = 255;
      } else if (!transparent) {
        raw[o] = lr;
        raw[o + 1] = lg;
        raw[o + 2] = lb;
      }
      // transparent + light module → leave RGBA (0,0,0,0)
    }
  }

  const ihdr = new Uint8Array(13);
  const dv = new DataView(ihdr.buffer);
  dv.setUint32(0, edge);
  dv.setUint32(4, edge);
  ihdr[8] = 8; // bit depth
  ihdr[9] = transparent ? 6 : 2; // color type: RGBA / RGB
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter method
  ihdr[12] = 0; // no interlace

  const idat = await deflate(raw);

  return concatBytes([
    SIGNATURE,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", new Uint8Array(0)),
  ]);
}
