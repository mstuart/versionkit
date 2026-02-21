import type { VersionStrategy, DeprecationConfig, RequestHandler } from './types.js';
import { extractFromHeader } from './strategies/header.js';
import { extractFromUrl } from './strategies/url.js';
import { extractFromAccept } from './strategies/accept.js';
import { applyDeprecationHeaders } from './deprecation.js';

export interface VersionRouterOptions {
  strategy: VersionStrategy;
  headerName?: string;
  defaultVersion?: string;
  versions: {
    [version: string]: {
      deprecated?: boolean;
      deprecation?: DeprecationConfig;
    };
  };
}

export class VersionRouter {
  private handlers = new Map<string, RequestHandler>();
  private opts: VersionRouterOptions;

  constructor(opts: VersionRouterOptions) {
    this.opts = opts;
  }

  handle(version: string, handler: RequestHandler): this {
    this.handlers.set(version, handler);
    return this;
  }

  resolveVersion(req: Request): string | null {
    let version: string | null = null;

    switch (this.opts.strategy) {
      case 'header':
        version = extractFromHeader(req, this.opts.headerName ?? 'Api-Version');
        break;
      case 'url':
        version = extractFromUrl(req);
        break;
      case 'accept':
        version = extractFromAccept(req);
        break;
    }

    if (!version && this.opts.defaultVersion) {
      version = this.opts.defaultVersion;
    }

    return version;
  }

  middleware(): (req: Request) => Promise<Response> {
    return async (req: Request): Promise<Response> => {
      const version = this.resolveVersion(req);

      if (!version) {
        return new Response(JSON.stringify({ error: 'API version is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const handler = this.handlers.get(version);
      if (!handler) {
        return new Response(JSON.stringify({ error: `Unsupported API version: ${version}` }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const response = await handler(req);

      const versionConfig = this.opts.versions[version];
      if (versionConfig?.deprecated && versionConfig.deprecation) {
        const headers = new Headers(response.headers);
        applyDeprecationHeaders(headers, versionConfig.deprecation);
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers,
        });
      }

      return response;
    };
  }
}

export function createVersionRouter(opts: VersionRouterOptions): VersionRouter {
  return new VersionRouter(opts);
}
