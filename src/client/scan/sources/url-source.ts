import { h } from "../../dom";
import { t } from "../../i18n/i18n";
import { icon } from "../../ui/icon";
import { decodeAndReport, type ScanReport, type ScanSource } from "../source";

export function createUrlSource(report: ScanReport): ScanSource {
  const input = h("input", {
    class: "input",
    type: "url",
    placeholder: t("scan.url.placeholder"),
    spellcheck: "false",
    autocapitalize: "off",
  }) as HTMLInputElement;

  async function submit(): Promise<void> {
    const url = input.value.trim();
    if (!url) return;
    report.onStatus("scanning");
    try {
      const res = await fetch(`/api/fetch-image?url=${encodeURIComponent(url)}`);
      if (!res.ok) {
        let message = t("scan.error");
        try {
          const body = (await res.json()) as { message?: string };
          if (body?.message) message = body.message;
        } catch {
          /* non-JSON error */
        }
        report.onStatus("error", message);
        return;
      }
      await decodeAndReport(await res.blob(), report);
    } catch {
      report.onStatus("error");
    }
  }

  const form = h(
    "form",
    {
      class: "url-form",
      onSubmit: (e: Event) => {
        e.preventDefault();
        void submit();
      },
    },
    input,
    h("button", { type: "submit", class: "btn btn-primary" }, icon("search", { size: 16 }), t("scan.url.go")),
  );

  return { el: h("div", { class: "scan-source" }, form) };
}
