export interface DetectHit {
  value: string;
  format: string;
}

export interface QrDetector {
  detect(source: ImageBitmapSource | CanvasImageSource): Promise<DetectHit[]>;
}

interface NativeBarcode {
  rawValue: string;
  format: string;
}
interface NativeDetector {
  detect(source: CanvasImageSource): Promise<NativeBarcode[]>;
}
interface NativeCtor {
  new (opts?: { formats?: string[] }): NativeDetector;
  getSupportedFormats?(): Promise<string[]>;
}

let cached: Promise<QrDetector> | null = null;

/** Resolve a QR detector once: native `BarcodeDetector`, else lazy zxing-wasm. */
export function getDetector(): Promise<QrDetector> {
  return (cached ??= create());
}

async function create(): Promise<QrDetector> {
  const Native = (globalThis as { BarcodeDetector?: NativeCtor }).BarcodeDetector;
  if (Native) {
    try {
      const formats = await Native.getSupportedFormats?.();
      if (!formats || formats.includes("qr_code")) {
        return wrap(new Native({ formats: ["qr_code"] }));
      }
    } catch {
      /* fall through to the WASM ponyfill */
    }
  }
  return loadPonyfill();
}

async function loadPonyfill(): Promise<QrDetector> {
  const [{ BarcodeDetector, setZXingModuleOverrides }, wasmModule] = await Promise.all([
    import("barcode-detector/ponyfill"),
    import("zxing-wasm/reader/zxing_reader.wasm?url"),
  ]);
  const wasmUrl = wasmModule.default;
  setZXingModuleOverrides({ locateFile: () => wasmUrl });
  return wrap(new BarcodeDetector({ formats: ["qr_code"] }) as unknown as NativeDetector);
}

function wrap(detector: NativeDetector): QrDetector {
  return {
    async detect(source) {
      const results = await detector.detect(source as CanvasImageSource);
      return results.map((r) => ({ value: r.rawValue, format: r.format }));
    },
  };
}
