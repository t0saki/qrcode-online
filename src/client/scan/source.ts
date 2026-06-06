import { decodeBlob } from "./decode";

export type ScanStatus = "idle" | "scanning" | "notfound" | "error";

export interface ScanReport {
  onResult(raw: string): void;
  onStatus(status: ScanStatus, message?: string): void;
}

export interface ScanSource {
  el: HTMLElement;
  activate?(): void;
  deactivate?(): void;
}

/** Decode an image Blob and report the outcome. */
export async function decodeAndReport(blob: Blob, report: ScanReport): Promise<void> {
  report.onStatus("scanning");
  try {
    const hits = await decodeBlob(blob);
    if (hits.length) report.onResult(hits[0]!.value);
    else report.onStatus("notfound");
  } catch {
    report.onStatus("error");
  }
}
