import { h } from "../../dom";
import { t } from "../../i18n/i18n";
import { icon } from "../../ui/icon";
import { createCamera, type CameraError } from "../camera";
import type { ScanReport, ScanSource } from "../source";

export function createCameraSource(report: ScanReport): ScanSource {
  const camera = createCamera({
    onResult: (hit) => report.onResult(hit.value),
    onError: (kind) => showStatus(kind),
  });

  camera.video.classList.add("viewfinder-video");

  const overlay = h(
    "div",
    { class: "viewfinder-overlay", "aria-hidden": "true" },
    h("div", { class: "viewfinder-cutout" }, h("span", { class: "vf-corner tl" }), h("span", { class: "vf-corner tr" }), h("span", { class: "vf-corner bl" }), h("span", { class: "vf-corner br" }), h("span", { class: "vf-scanline" })),
  );

  const torchBtn = h(
    "button",
    { type: "button", class: "camera-ctl", title: t("scan.camera.torch"), "aria-label": t("scan.camera.torch"), onClick: () => void camera.toggleTorch() },
    icon("zap", { size: 18 }),
  );
  const flipBtn = h(
    "button",
    { type: "button", class: "camera-ctl", title: t("scan.camera.flip"), "aria-label": t("scan.camera.flip"), onClick: () => void camera.switchCamera() },
    icon("flip", { size: 18 }),
  );
  const controls = h("div", { class: "camera-controls" }, torchBtn, flipBtn);

  const statusEl = h("div", { class: "camera-status" });

  const viewfinder = h("div", { class: "viewfinder" }, camera.video, overlay, controls, statusEl);

  function showStatus(state: "loading" | CameraError): void {
    viewfinder.dataset.state = state === "loading" ? "loading" : "error";
    if (state === "loading") {
      statusEl.replaceChildren(h("div", { class: "spinner" }), h("p", {}, t("scan.preparing")));
      return;
    }
    const msg = state === "denied" ? t("scan.camera.denied") : state === "none" ? t("scan.camera.none") : t("scan.error");
    statusEl.replaceChildren(icon("camera", { size: 28, class: "camera-status-glyph" }), h("p", {}, msg));
  }

  function applyCapabilities(): void {
    const caps = camera.capabilities();
    torchBtn.hidden = !caps.torch;
    flipBtn.hidden = !caps.multiple;
  }

  return {
    el: h("div", { class: "scan-source camera-source" }, viewfinder),
    activate: async () => {
      showStatus("loading");
      const ok = await camera.start();
      if (ok) {
        viewfinder.dataset.state = "active";
        applyCapabilities();
      }
    },
    deactivate: () => camera.stop(),
  };
}
