// biome-ignore lint/performance/noBarrelFile: This is the package's intentional public entry point.
export { applyDeprecationHeaders } from "./deprecation.js";
export type { VersionRouterOptions } from "./router.js";
export { createVersionRouter, VersionRouter } from "./router.js";
export { extractFromAccept } from "./strategies/accept.js";
export { extractFromHeader } from "./strategies/header.js";
export { extractFromUrl } from "./strategies/url.js";
export type {
  DeprecationConfig,
  RequestHandler,
  VersionConfig,
  VersionStrategy,
} from "./types.js";
