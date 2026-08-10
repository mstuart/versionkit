const VERSION_PATH_PATTERN = /^\/v([^/]+)/;

export function extractFromUrl(req: Request): string | null {
  const url = new URL(req.url);
  const match = url.pathname.match(VERSION_PATH_PATTERN);
  return match ? match[1] : null;
}
