export type VersionStrategy = "header" | "url" | "accept";

export interface DeprecationConfig {
  /** RFC 9745: Deprecation header date */
  deprecatedSince?: Date;
  /** RFC 8594: Link header to deprecation docs */
  link?: string;
  /** RFC 8594: Sunset header date */
  sunset?: Date;
}

export interface VersionConfig {
  deprecation?: DeprecationConfig;
  routes: Map<string, RequestHandler>;
}

export type RequestHandler = (req: Request) => Response | Promise<Response>;
