import { h } from "../../dom";
import { t } from "../../i18n/i18n";
import { icon } from "../../ui/icon";
import { decodeAndReport, type ScanReport, type ScanSource } from "../source";

export function createFileSource(report: ScanReport): ScanSource {
  const input = h("input", { type: "file", accept: "image/*", class: "sr-only" }) as HTMLInputElement;
  input.addEventListener("change", () => {
    const file = input.files?.[0];
    input.value = "";
    if (file) void decodeAndReport(file, report);
  });

  const zone = h(
    "button",
    {
      type: "button",
      class: "dropzone",
      onClick: () => input.click(),
    },
    icon("upload", { size: 30, class: "dropzone-glyph" }),
    h("p", {}, t("scan.upload.hint")),
  );

  const stop = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
  };
  zone.addEventListener("dragenter", (e) => {
    stop(e);
    zone.classList.add("is-dragover");
  });
  zone.addEventListener("dragover", (e) => {
    stop(e);
    zone.classList.add("is-dragover");
  });
  zone.addEventListener("dragleave", (e) => {
    stop(e);
    zone.classList.remove("is-dragover");
  });
  zone.addEventListener("drop", (e) => {
    stop(e);
    zone.classList.remove("is-dragover");
    const file = (e as DragEvent).dataTransfer?.files?.[0];
    if (file && file.type.startsWith("image/")) void decodeAndReport(file, report);
  });

  return { el: h("div", { class: "scan-source" }, input, zone) };
}
