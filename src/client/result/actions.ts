import type { ParsedResult } from "../../shared/parse/parse-result";
import { t } from "../i18n/i18n";
import { toast } from "../ui/toast";
import type { IconName } from "../ui/icon";
import { copyText, download } from "../util";

export interface ResultAction {
  label: string;
  icon: IconName;
  primary?: boolean;
  run(): void;
}

export const KIND_ICON: Record<ParsedResult["kind"], IconName> = {
  url: "link",
  wifi: "wifi",
  contact: "user",
  geo: "map-pin",
  email: "mail",
  tel: "phone",
  sms: "message",
  event: "calendar",
  text: "search",
};

/** Emit an event the app listens for to switch to Generate with this data. */
export function requestGenerate(data: string): void {
  document.dispatchEvent(new CustomEvent("qro:generate", { detail: data }));
}

async function copy(text: string): Promise<void> {
  toast((await copyText(text)) ? t("action.copied") : t("action.copyText"), { icon: "check" });
}

function open(href: string): void {
  window.open(href, "_blank", "noopener,noreferrer");
}

export function actionsFor(r: ParsedResult): ResultAction[] {
  const makeQr: ResultAction = { label: t("result.makeQr"), icon: "qr-code", run: () => requestGenerate(r.raw) };
  const copyRaw: ResultAction = { label: t("action.copyText"), icon: "copy", run: () => void copy(r.raw) };

  switch (r.kind) {
    case "url":
      return [
        { label: t("result.openLink"), icon: "external-link", primary: true, run: () => open(r.href) },
        copyRaw,
        makeQr,
      ];
    case "wifi":
      return [
        ...(r.password
          ? [{ label: t("result.copyPassword"), icon: "copy" as IconName, primary: true, run: () => void copy(r.password!) }]
          : []),
        copyRaw,
        makeQr,
      ];
    case "contact":
      return [
        { label: t("result.saveContact"), icon: "download", primary: true, run: () => download(new Blob([contactVcf(r)], { type: "text/vcard" }), `${r.name || "contact"}.vcf`) },
        ...(r.tel ? [{ label: t("result.call"), icon: "phone" as IconName, run: () => open(`tel:${r.tel}`) }] : []),
        ...(r.email ? [{ label: t("result.compose"), icon: "mail" as IconName, run: () => open(`mailto:${r.email}`) }] : []),
        copyRaw,
      ];
    case "geo":
      return [
        { label: t("result.openMaps"), icon: "map-pin", primary: true, run: () => open(mapsUrl(r)) },
        copyRaw,
        makeQr,
      ];
    case "email":
      return [
        { label: t("result.compose"), icon: "mail", primary: true, run: () => open(mailtoUrl(r)) },
        copyRaw,
        makeQr,
      ];
    case "tel":
      return [
        { label: t("result.call"), icon: "phone", primary: true, run: () => open(`tel:${r.number}`) },
        copyRaw,
        makeQr,
      ];
    case "sms":
      return [
        { label: t("result.sendSms"), icon: "message", primary: true, run: () => open(`sms:${r.number}`) },
        copyRaw,
        makeQr,
      ];
    case "event":
      return [
        { label: t("result.saveEvent"), icon: "download", primary: true, run: () => download(new Blob([eventIcs(r)], { type: "text/calendar" }), `${r.summary || "event"}.ics`) },
        copyRaw,
        makeQr,
      ];
    case "text":
      return [
        { label: t("action.copyText"), icon: "copy", primary: true, run: () => void copy(r.text) },
        { label: t("result.search"), icon: "search", run: () => open(`https://www.google.com/search?q=${encodeURIComponent(r.text)}`) },
        makeQr,
      ];
  }
}

function mapsUrl(r: Extract<ParsedResult, { kind: "geo" }>): string {
  const q = r.query ? encodeURIComponent(r.query) : `${r.lat},${r.lng}`;
  return `https://www.google.com/maps?q=${q}`;
}

function mailtoUrl(r: Extract<ParsedResult, { kind: "email" }>): string {
  const params = new URLSearchParams();
  if (r.subject) params.set("subject", r.subject);
  if (r.body) params.set("body", r.body);
  const qs = params.toString();
  return `mailto:${r.to}${qs ? `?${qs}` : ""}`;
}

function contactVcf(r: Extract<ParsedResult, { kind: "contact" }>): string {
  if (r.format === "vcard") return r.raw;
  const lines = ["BEGIN:VCARD", "VERSION:3.0"];
  if (r.name) lines.push(`FN:${r.name}`);
  if (r.tel) lines.push(`TEL:${r.tel}`);
  if (r.email) lines.push(`EMAIL:${r.email}`);
  if (r.org) lines.push(`ORG:${r.org}`);
  lines.push("END:VCARD");
  return lines.join("\r\n");
}

function eventIcs(r: Extract<ParsedResult, { kind: "event" }>): string {
  if (/BEGIN:VCALENDAR/i.test(r.raw)) return r.raw;
  const vevent = /BEGIN:VEVENT/i.test(r.raw)
    ? r.raw
    : ["BEGIN:VEVENT", r.summary && `SUMMARY:${r.summary}`, r.start && `DTSTART:${r.start}`, r.end && `DTEND:${r.end}`, r.location && `LOCATION:${r.location}`, "END:VEVENT"]
        .filter(Boolean)
        .join("\r\n");
  return `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//qrcode-online//EN\r\n${vevent}\r\nEND:VCALENDAR`;
}
