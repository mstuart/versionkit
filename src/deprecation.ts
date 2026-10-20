import type { DeprecationConfig } from "./types.js";

export function applyDeprecationHeaders(
  headers: Headers,
  config: DeprecationConfig
): void {
  // RFC 8594: Sunset header (HTTP-date format)
  if (config.sunset) {
    headers.set("Sunset", config.sunset.toUTCString());
  }

  // RFC 9745: Deprecation header (Unix timestamp)
  const deprecatedAt =
    config.deprecatedSince?.getTime() ??
    Math.min(Date.now(), config.sunset?.getTime() ?? Number.POSITIVE_INFINITY);
  const timestamp = Math.floor(deprecatedAt / 1000);
  headers.set("Deprecation", `@${timestamp}`);

  // RFC 8594: Link header
  if (config.link) {
    headers.append("Link", `<${config.link}>; rel="deprecation"`);
  }
}
