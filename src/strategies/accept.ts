export function extractFromAccept(req: Request): string | null {
  const accept = req.headers.get('Accept');
  if (!accept) return null;
  const match = accept.match(/application\/vnd\.[^.]+\.(v[^+]+)\+/);
  return match ? match[1] : null;
}
