const MEDIA_TOKEN_PATTERN = /^[a-z0-9!#$%&'*+.^_`|~-]+$/i;
const QUALITY_PARAMETER_PATTERN = /^q\s*=\s*(.*)$/i;
const QUALITY_VALUE_PATTERN = /^(?:0(?:\.\d{0,3})?|1(?:\.0{0,3})?)$/;

function splitOutsideQuotes(value: string, delimiter: string): string[] {
  const parts: string[] = [];
  let part = "";
  let quoted = false;
  let escaped = false;
  for (const character of value) {
    if (escaped) {
      part += character;
      escaped = false;
      continue;
    }
    if (quoted && character === "\\") {
      part += character;
      escaped = true;
      continue;
    }
    if (character === '"') {
      quoted = !quoted;
    }
    if (character === delimiter && !quoted) {
      parts.push(part);
      part = "";
    } else {
      part += character;
    }
  }
  parts.push(part);
  return parts;
}

function extractMediaVersion(mediaType: string): string | null {
  const normalized = mediaType.trim();
  const prefix = "application/vnd.";
  if (!normalized.toLowerCase().startsWith(prefix)) {
    return null;
  }
  const subtype = normalized.slice(prefix.length);
  if (!MEDIA_TOKEN_PATTERN.test(subtype)) {
    return null;
  }
  const lastSuffix = subtype.lastIndexOf("+");
  const versionMarker = subtype.toLowerCase().lastIndexOf(".v", lastSuffix);
  const suffix = subtype.indexOf("+", versionMarker + 2);
  if (
    versionMarker < 1 ||
    suffix <= versionMarker + 2 ||
    suffix === subtype.length - 1
  ) {
    return null;
  }
  return subtype.slice(versionMarker + 1, suffix);
}

export function extractFromAccept(req: Request): string | null {
  const accept = req.headers.get("Accept");
  if (!accept) {
    return null;
  }
  let version: string | null = null;
  let bestQuality = 0;
  for (const range of splitOutsideQuotes(accept, ",")) {
    const [mediaType, ...parameters] = splitOutsideQuotes(range, ";");
    const candidate = extractMediaVersion(mediaType);
    if (!candidate) {
      continue;
    }
    const qualityParameter = parameters
      .map((parameter) => parameter.trim().match(QUALITY_PARAMETER_PATTERN))
      .find((parameter) => parameter !== null);
    const rawQuality = qualityParameter?.[1] ?? "1";
    if (!QUALITY_VALUE_PATTERN.test(rawQuality)) {
      continue;
    }
    const quality = Number(rawQuality);
    if (quality > bestQuality) {
      bestQuality = quality;
      version = candidate;
    }
  }
  return version;
}
