import { getDetector, type DetectHit } from "./detector";

const MAX_EDGE = 1600;

/** Decode a QR from an image Blob (file / paste / proxied URL). */
export async function decodeBlob(blob: Blob): Promise<DetectHit[]> {
  const bitmap = await createImageBitmap(blob);
  try {
    const detector = await getDetector();
    return await detector.detect(downscale(bitmap));
  } finally {
    bitmap.close();
  }
}

/** Large photos slow detection; cap the longest edge before decoding. */
function downscale(bitmap: ImageBitmap): CanvasImageSource {
  const longest = Math.max(bitmap.width, bitmap.height);
  if (longest <= MAX_EDGE) return bitmap;
  const scale = MAX_EDGE / longest;
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, w, h);
  return canvas;
}
