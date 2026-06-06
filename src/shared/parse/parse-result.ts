/** A decoded QR payload, parsed into a structured, actionable shape. */
export type ParsedResult =
  | { kind: "url"; raw: string; href: string }
  | { kind: "wifi"; raw: string; ssid: string; auth: string; password?: string; hidden: boolean }
  | {
      kind: "contact";
      raw: string;
      format: "vcard" | "mecard";
      name?: string;
      tel?: string;
      email?: string;
      org?: string;
    }
  | { kind: "geo"; raw: string; lat: number; lng: number; query?: string }
  | { kind: "email"; raw: string; to: string; subject?: string; body?: string }
  | { kind: "tel"; raw: string; number: string }
  | { kind: "sms"; raw: string; number: string; body?: string }
  | { kind: "event"; raw: string; summary?: string; start?: string; end?: string; location?: string }
  | { kind: "text"; raw: string; text: string };

export type ResultKind = ParsedResult["kind"];

export function parseResult(raw: string): ParsedResult {
  const text = raw.trim();
  const upper = text.toUpperCase();

  if (upper.startsWith("WIFI:")) return parseWifi(text);
  if (upper.startsWith("BEGIN:VCARD")) return parseVCard(text);
  if (upper.startsWith("MECARD:")) return parseMeCard(text);
  if (upper.startsWith("BEGIN:VEVENT") || upper.startsWith("BEGIN:VCALENDAR")) return parseEvent(text);
  if (upper.startsWith("MAILTO:")) return parseMailto(text);
  if (upper.startsWith("MATMSG:")) return parseMatmsg(text);
  if (upper.startsWith("GEO:")) return parseGeo(text);
  if (upper.startsWith("TEL:")) return { kind: "tel", raw, number: text.slice(4).trim() };
  if (upper.startsWith("SMSTO:")) return parseSmsto(text);
  if (upper.startsWith("SMS:")) return parseSms(text);
  if (/^https?:\/\//i.test(text)) return { kind: "url", raw, href: text };
  if (isBareDomain(text)) return { kind: "url", raw, href: `https://${text}` };

  return { kind: "text", raw, text };
}

/** Split on unescaped separators (handles `\;` / `\,` escaping). */
function splitEscaped(input: string, sep: string): string[] {
  const out: string[] = [];
  let cur = "";
  for (let i = 0; i < input.length; i++) {
    const c = input[i]!;
    if (c === "\\" && i + 1 < input.length) {
      cur += input[i + 1];
      i++;
    } else if (c === sep) {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

function parseWifi(text: string): ParsedResult {
  const body = text.slice(5);
  const fields: Record<string, string> = {};
  for (const part of splitEscaped(body, ";")) {
    const idx = part.indexOf(":");
    if (idx > 0) fields[part.slice(0, idx).toUpperCase()] = part.slice(idx + 1);
  }
  return {
    kind: "wifi",
    raw: text,
    ssid: fields["S"] ?? "",
    auth: (fields["T"] || "nopass").toUpperCase(),
    password: fields["P"] || undefined,
    hidden: /^true$/i.test(fields["H"] ?? ""),
  };
}

function unfoldLines(text: string): string[] {
  return text.replace(/\r\n/g, "\n").replace(/\n[ \t]/g, "").split("\n");
}

function parseVCard(text: string): ParsedResult {
  let name: string | undefined;
  let tel: string | undefined;
  let email: string | undefined;
  let org: string | undefined;
  for (const line of unfoldLines(text)) {
    const idx = line.indexOf(":");
    if (idx < 0) continue;
    const key = line.slice(0, idx).toUpperCase();
    const value = line.slice(idx + 1).trim();
    if (key === "FN") name = value;
    else if (key.startsWith("N") && !name) name = value.split(";").filter(Boolean).reverse().join(" ").trim();
    else if (key.startsWith("TEL") && !tel) tel = value;
    else if (key.startsWith("EMAIL") && !email) email = value;
    else if (key.startsWith("ORG") && !org) org = value.replace(/;+$/, "");
  }
  return { kind: "contact", raw: text, format: "vcard", name, tel, email, org };
}

function parseMeCard(text: string): ParsedResult {
  const fields: Record<string, string> = {};
  for (const part of splitEscaped(text.slice(7), ";")) {
    const idx = part.indexOf(":");
    if (idx > 0) fields[part.slice(0, idx).toUpperCase()] = part.slice(idx + 1);
  }
  const name = fields["N"] ? fields["N"].split(",").reverse().join(" ").trim() : undefined;
  return {
    kind: "contact",
    raw: text,
    format: "mecard",
    name,
    tel: fields["TEL"] || undefined,
    email: fields["EMAIL"] || undefined,
    org: fields["ORG"] || undefined,
  };
}

function parseEvent(text: string): ParsedResult {
  const get = (key: string) => {
    const m = unfoldLines(text).find((l) => l.toUpperCase().startsWith(key));
    if (!m) return undefined;
    const idx = m.indexOf(":");
    return idx >= 0 ? m.slice(idx + 1).trim() : undefined;
  };
  return {
    kind: "event",
    raw: text,
    summary: get("SUMMARY"),
    start: get("DTSTART"),
    end: get("DTEND"),
    location: get("LOCATION"),
  };
}

function parseMailto(text: string): ParsedResult {
  const rest = text.slice(7);
  const [to, query = ""] = rest.split("?");
  const params = new URLSearchParams(query);
  return {
    kind: "email",
    raw: text,
    to: decodeURIComponent(to ?? ""),
    subject: params.get("subject") ?? undefined,
    body: params.get("body") ?? undefined,
  };
}

function parseMatmsg(text: string): ParsedResult {
  const fields: Record<string, string> = {};
  for (const part of splitEscaped(text.slice(7), ";")) {
    const idx = part.indexOf(":");
    if (idx > 0) fields[part.slice(0, idx).toUpperCase()] = part.slice(idx + 1);
  }
  return {
    kind: "email",
    raw: text,
    to: fields["TO"] ?? "",
    subject: fields["SUB"] || undefined,
    body: fields["BODY"] || undefined,
  };
}

function parseGeo(text: string): ParsedResult {
  const [coords, query = ""] = text.slice(4).split("?");
  const [latStr, lngStr] = (coords ?? "").split(",");
  const params = new URLSearchParams(query);
  return {
    kind: "geo",
    raw: text,
    lat: Number(latStr),
    lng: Number(lngStr),
    query: params.get("q") ?? undefined,
  };
}

function parseSmsto(text: string): ParsedResult {
  const rest = text.slice(6);
  const idx = rest.indexOf(":");
  return {
    kind: "sms",
    raw: text,
    number: idx >= 0 ? rest.slice(0, idx) : rest,
    body: idx >= 0 ? rest.slice(idx + 1) : undefined,
  };
}

function parseSms(text: string): ParsedResult {
  const rest = text.slice(4);
  const [number, query = ""] = rest.split("?");
  const params = new URLSearchParams(query);
  return { kind: "sms", raw: text, number: number ?? "", body: params.get("body") ?? undefined };
}

function isBareDomain(text: string): boolean {
  return /^[a-z0-9][a-z0-9-]*(\.[a-z0-9-]+)+(\/\S*)?$/i.test(text) && !text.includes(" ");
}
