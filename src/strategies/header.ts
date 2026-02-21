export function extractFromHeader(req: Request, headerName: string): string | null {
  return req.headers.get(headerName) || null;
}
