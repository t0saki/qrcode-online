import "./scan.css";

import { parseResult } from "../../shared/parse/parse-result";
import { clear, h, mount } from "../dom";
import { t } from "../i18n/i18n";
import { createResultCard } from "../result/result-card";
import { segmented } from "../ui/segmented";
import type { ViewHandle } from "../view";
import { createCameraSource } from "./sources/camera-source";
import { createFileSource } from "./sources/file-source";
import { createPasteSource } from "./sources/paste-source";
import { createUrlSource } from "./sources/url-source";
import type { ScanReport, ScanSource, ScanStatus } from "./source";

type SourceKey = "camera" | "upload" | "paste" | "url";
const KEY = "qro.scan.src";

export function createScanView(): ViewHandle {
  const surface = h("div", { class: "scan-surface" });
  const status = h("div", { class: "scan-status", role: "status", "aria-live": "polite", hidden: true });
  const resultMount = h("div", { class: "scan-result" });

  const report: ScanReport = {
    onResult: showResult,
    onStatus: showStatus,
  };

  const builders: Record<SourceKey, () => ScanSource> = {
    camera: () => createCameraSource(report),
    upload: () => createFileSource(report),
    paste: () => createPasteSource(report),
    url: () => createUrlSource(report),
  };

  let current: SourceKey = readDefault();
  let active: ScanSource | null = null;
  let isActiveMode = false;

  function selectSource(key: SourceKey): void {
    active?.deactivate?.();
    current = key;
    try {
      localStorage.setItem(KEY, key);
    } catch {
      /* ignore */
    }
    active = builders[key]();
    mount(surface, active.el);
    clear(resultMount);
    clearStatus();
    if (isActiveMode) active.activate?.();
  }

  const sourceSwitch = segmented({
    options: [
      { value: "camera", label: t("scan.source.camera"), icon: "camera" },
      { value: "upload", label: t("scan.source.upload"), icon: "upload" },
      { value: "paste", label: t("scan.source.paste"), icon: "clipboard" },
      { value: "url", label: t("scan.source.url"), icon: "image" },
    ],
    value: current,
    ariaLabel: t("mode.scan"),
    onChange: (v) => selectSource(v as SourceKey),
  });
  sourceSwitch.el.classList.add("segmented-block");

  function showResult(raw: string): void {
    clearStatus();
    mount(resultMount, createResultCard(parseResult(raw)));
    navigator.vibrate?.(12);
    resultMount.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function showStatus(state: ScanStatus, message?: string): void {
    if (state === "idle") return clearStatus();
    status.hidden = false;
    status.dataset.tone = state === "scanning" ? "muted" : state === "notfound" ? "warn" : "error";
    status.textContent =
      message ??
      (state === "scanning" ? t("scan.scanning") : state === "notfound" ? t("scan.notfound") : t("scan.error"));
  }

  function clearStatus(): void {
    status.hidden = true;
    status.textContent = "";
  }

  active = builders[current]();
  mount(surface, active.el);

  const el = h(
    "div",
    { class: "view view-scan" },
    h("div", { class: "scan-source-switch" }, sourceSwitch.el),
    surface,
    status,
    resultMount,
  );

  return {
    el,
    activate: () => {
      isActiveMode = true;
      active?.activate?.();
    },
    deactivate: () => {
      isActiveMode = false;
      active?.deactivate?.();
    },
    destroy: () => active?.deactivate?.(),
  };
}

function readDefault(): SourceKey {
  const saved = localStorage.getItem(KEY);
  if (saved === "camera" || saved === "upload" || saved === "paste" || saved === "url") return saved;
  return matchMedia("(pointer: coarse)").matches ? "camera" : "upload";
}
