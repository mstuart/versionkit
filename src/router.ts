import { applyDeprecationHeaders } from "./deprecation.js";
import { extractFromAccept } from "./strategies/accept.js";
import { extractFromHeader } from "./strategies/header.js";
import { extractFromUrl } from "./strategies/url.js";
import type {
  DeprecationConfig,
  RequestHandler,
  VersionStrategy,
} from "./types.js";

export interface VersionRouterOptions {
  defaultVersion?: string;
  headerName?: string;
  strategy: VersionStrategy;
  versions: {
    [version: string]: {
      deprecated?: boolean;
      deprecation?: DeprecationConfig;
    };
  };
}

export class VersionRouter {
  private readonly handlers = new Map<string, RequestHandler>();
  private readonly opts: VersionRouterOptions;

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
      case "header":
        version = extractFromHeader(req, this.opts.headerName ?? "Api-Version");
        break;
      case "url":
        version = extractFromUrl(req);
        break;
      case "accept":
        version = extractFromAccept(req);
        break;
      default:
        return null;
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
        return new Response(
          JSON.stringify({ error: "API version is required" }),
          {
            headers: { "Content-Type": "application/json" },
            status: 400,
          }
        );
      }

      const handler = this.handlers.get(version);
      if (!handler) {
        return new Response(
          JSON.stringify({ error: `Unsupported API version: ${version}` }),
          {
            headers: { "Content-Type": "application/json" },
            status: 400,
          }
        );
      }

      const response = await handler(req);

      const versionConfig = this.opts.versions[version];
      if (versionConfig?.deprecated && versionConfig.deprecation) {
        const headers = new Headers(response.headers);
        applyDeprecationHeaders(headers, versionConfig.deprecation);
        return new Response(response.body, {
          headers,
          status: response.status,
          statusText: response.statusText,
        });
      }

      return response;
    };
  }
}

export function createVersionRouter(opts: VersionRouterOptions): VersionRouter {
  return new VersionRouter(opts);
}
