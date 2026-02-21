export function extractFromUrl(req: Request): string | null {
  const url = new URL(req.url);
  const match = url.pathname.match(/^\/v([^/]+)/);
  return match ? match[1] : null;
}
