const VERSION_MEDIA_TYPE_PATTERN = /application\/vnd\.[^.]+\.(v[^+]+)\+/;

export function extractFromAccept(req: Request): string | null {
  const accept = req.headers.get("Accept");
  if (!accept) {
    return null;
  }
  const match = accept.match(VERSION_MEDIA_TYPE_PATTERN);
  return match ? match[1] : null;
}
