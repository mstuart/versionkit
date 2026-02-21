import type { DeprecationConfig } from './types.js';

export function applyDeprecationHeaders(headers: Headers, config: DeprecationConfig): void {
  // RFC 8594: Sunset header (HTTP-date format)
  if (config.sunset) {
    headers.set('Sunset', config.sunset.toUTCString());
  }

  // RFC 9745: Deprecation header (Unix timestamp)
  if (config.deprecatedSince) {
    const timestamp = Math.floor(config.deprecatedSince.getTime() / 1000);
    headers.set('Deprecation', `@${timestamp}`);
  } else {
    headers.set('Deprecation', 'true');
  }

  // RFC 8594: Link header
  if (config.link) {
    headers.set('Link', `<${config.link}>; rel="deprecation"`);
  }
}
