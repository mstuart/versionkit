export { VersionRouter, createVersionRouter } from './router.js';
export type { VersionRouterOptions } from './router.js';
export type { VersionStrategy, DeprecationConfig, VersionConfig, RequestHandler } from './types.js';
export { applyDeprecationHeaders } from './deprecation.js';
export { extractFromHeader } from './strategies/header.js';
export { extractFromUrl } from './strategies/url.js';
export { extractFromAccept } from './strategies/accept.js';
