<div align="center">
  <img src="docs/assets/logo.svg" alt="versionkit — Framework-agnostic API versioning with RFC 8594 Sunset and RFC 9745 Deprecation headers" width="720">
</div>

<p align="center"><strong>Framework-agnostic API versioning with RFC 8594 Sunset and RFC 9745 Deprecation headers</strong></p>

<p align="center">
  <a href="https://github.com/mstuart/versionkit/actions/workflows/ci.yml"><img src="https://github.com/mstuart/versionkit/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/versionkit"><img src="https://img.shields.io/npm/v/versionkit?label=npm" alt="npm"></a>
</p>

---
Framework-agnostic API versioning with full RFC compliance.

Supports RFC 8594 (Sunset header), RFC 9745 (Deprecation header), and three version extraction strategies. Works with Hono, Fastify, Express, and any framework using Web Standards Request/Response.

## Why

APIs evolve. Clients need time to migrate. versionkit gives you:

- **Version routing** - dispatch requests to the right handler based on version
- **Deprecation signals** - automatically inject RFC-compliant headers so clients know when versions are going away
- **Framework freedom** - built on Web Standards, works everywhere

## Install

```bash
npm install versionkit
```

## Strategies

| Strategy | Source | Example |
|----------|--------|---------|
| `header` | Custom request header | `Api-Version: 2025-01-01` |
| `url` | URL path prefix | `/v2/users` |
| `accept` | Accept header media type | `application/vnd.api.v2+json` |

## Usage

### Header Strategy

```typescript
import { createVersionRouter } from 'versionkit';

const router = createVersionRouter({
  strategy: 'header',
  headerName: 'Api-Version', // default
  defaultVersion: '1',
  versions: {
    '1': {
      deprecated: true,
      deprecation: {
        sunset: new Date('2026-06-01'),
        deprecatedSince: new Date('2025-01-01'),
        link: 'https://docs.example.com/changelog',
      },
    },
    '2': {},
  },
});

router
  .handle('1', (req) => new Response(JSON.stringify({ version: 1 })))
  .handle('2', (req) => new Response(JSON.stringify({ version: 2 })));

const handler = router.middleware();
// handler(request) => Promise<Response>
```

### URL Strategy

```typescript
const router = createVersionRouter({
  strategy: 'url',
  versions: { '1': {}, '2': {} },
});

router
  .handle('1', () => new Response('v1'))
  .handle('2', () => new Response('v2'));

// GET /v2/users -> dispatches to version "2" handler
```

### Accept Header Strategy

```typescript
const router = createVersionRouter({
  strategy: 'accept',
  versions: { 'v1': {}, 'v2': {} },
});

router
  .handle('v1', () => new Response('v1'))
  .handle('v2', () => new Response('v2'));

// Accept: application/vnd.api.v2+json -> dispatches to "v2" handler
```

## RFC Compliance

### RFC 8594 - Sunset Header

When a version has a `sunset` date, the response includes:

```
Sunset: Mon, 01 Jun 2026 00:00:00 GMT
```

When a `link` is provided, the response includes:

```
Link: <https://docs.example.com/changelog>; rel="deprecation"
```

### RFC 9745 - Deprecation Header

When `deprecatedSince` is set:

```
Deprecation: @1735689600
```

When no date is specified but the version is deprecated:

```
Deprecation: true
```

## Framework Integration

### Hono

```typescript
import { Hono } from 'hono';
import { createVersionRouter } from 'versionkit';

const app = new Hono();
const router = createVersionRouter({ strategy: 'header', versions: { '1': {} } });
router.handle('1', (req) => new Response('v1'));

app.all('/api/*', (c) => router.middleware()(c.req.raw));
```

### Express

```typescript
import express from 'express';
import { createVersionRouter } from 'versionkit';

const app = express();
const router = createVersionRouter({ strategy: 'header', versions: { '1': {} } });
router.handle('1', (req) => new Response('v1'));

const handler = router.middleware();

app.use('/api', async (req, res) => {
  const webReq = new Request(`http://${req.headers.host}${req.url}`, {
    method: req.method,
    headers: req.headers as any,
  });
  const webRes = await handler(webReq);
  res.status(webRes.status);
  webRes.headers.forEach((v, k) => res.setHeader(k, v));
  res.send(await webRes.text());
});
```

### Fastify

```typescript
import Fastify from 'fastify';
import { createVersionRouter } from 'versionkit';

const fastify = Fastify();
const router = createVersionRouter({ strategy: 'url', versions: { '1': {} } });
router.handle('1', (req) => new Response('v1'));

const handler = router.middleware();

fastify.all('/v*', async (req, reply) => {
  const webReq = new Request(`http://${req.hostname}${req.url}`, {
    method: req.method,
    headers: req.headers as any,
  });
  const webRes = await handler(webReq);
  reply.status(webRes.status);
  webRes.headers.forEach((v, k) => reply.header(k, v));
  reply.send(await webRes.text());
});
```

## API

### `createVersionRouter(opts: VersionRouterOptions): VersionRouter`

Creates a new version router.

### `VersionRouter.handle(version: string, handler: RequestHandler): this`

Registers a handler for a specific version. Chainable.

### `VersionRouter.middleware(): (req: Request) => Promise<Response>`

Returns a request handler that dispatches to the correct versioned handler.

### `VersionRouter.resolveVersion(req: Request): string | null`

Resolves which version applies to a given request without dispatching.

## License

MIT
