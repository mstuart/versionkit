export type VersionStrategy = 'header' | 'url' | 'accept';

export interface DeprecationConfig {
  /** RFC 8594: Sunset header date */
  sunset?: Date;
  /** RFC 8594: Link header to deprecation docs */
  link?: string;
  /** RFC 9745: Deprecation header date */
  deprecatedSince?: Date;
}

export interface VersionConfig {
  routes: Map<string, RequestHandler>;
  deprecation?: DeprecationConfig;
}

export type RequestHandler = (req: Request) => Response | Promise<Response>;
