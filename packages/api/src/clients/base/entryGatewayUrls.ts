/**
 * Canonical Entry Gateway hosts and base URLs — the single source of truth
 * for the three backend environments.
 *
 * This module intentionally has ZERO imports so it stays safe to use from
 * any context: client bundles, node servers, Cloudflare Workers, vite
 * configs, and build scripts. Do not add imports or logic here.
 *
 * Consumers inside the monorepo should import these via `@universe/api`
 * (or this module directly where the barrel is too heavy). Sites that
 * cannot import TypeScript (env files, JSON/YAML configs, workflows) carry
 * a TODO comment pointing back at this file instead.
 */

/** Entry Gateway hostname for the dev backend environment. */
export const DEV_ENTRY_GATEWAY_HOST = 'entry-gateway.backend-dev.api.uniswap.org'
/** Entry Gateway hostname for the staging backend environment. */
export const STAGING_ENTRY_GATEWAY_HOST = 'entry-gateway.backend-staging.api.uniswap.org'
/** Entry Gateway hostname for the production backend environment. */
export const PROD_ENTRY_GATEWAY_HOST = 'entry-gateway.backend-prod.api.uniswap.org'

/** Entry Gateway base URL for the dev backend environment. */
export const DEV_ENTRY_GATEWAY_API_BASE_URL: string = `https://${DEV_ENTRY_GATEWAY_HOST}`
/** Entry Gateway base URL for the staging backend environment. */
export const STAGING_ENTRY_GATEWAY_API_BASE_URL: string = `https://${STAGING_ENTRY_GATEWAY_HOST}`
/** Entry Gateway base URL for the production backend environment. */
export const PROD_ENTRY_GATEWAY_API_BASE_URL: string = `https://${PROD_ENTRY_GATEWAY_HOST}`

/**
 * Entry Gateway hostnames reserved for the DEVELOPER PORTAL.
 *
 * These reach the same gateway service as the hosts above, but on their own
 * CloudFront-fronted names. The session cookie is host-only, so the hostname a
 * client connects to is what decides which cookie jar its session lands in:
 * the portal addressing these names is the whole mechanism separating its
 * session from the web app's.
 *
 * Dev-portal traffic ONLY — pointing another surface at these would put its
 * callers in the portal's cookie jar and undo that separation.
 */
/** Dev-portal Entry Gateway hostname for the dev backend environment. */
export const DEV_PORTAL_API_HOST = 'dev.portal-api.uniswap.org'
/** Dev-portal Entry Gateway hostname for the staging backend environment. */
export const STAGING_PORTAL_API_HOST = 'staging.portal-api.uniswap.org'
/** Dev-portal Entry Gateway hostname for the production backend environment. */
export const PROD_PORTAL_API_HOST = 'portal-api.uniswap.org'

/** Dev-portal Entry Gateway base URL for the dev backend environment. */
export const DEV_PORTAL_API_BASE_URL: string = `https://${DEV_PORTAL_API_HOST}`
/** Dev-portal Entry Gateway base URL for the staging backend environment. */
export const STAGING_PORTAL_API_BASE_URL: string = `https://${STAGING_PORTAL_API_HOST}`
/** Dev-portal Entry Gateway base URL for the production backend environment. */
export const PROD_PORTAL_API_BASE_URL: string = `https://${PROD_PORTAL_API_HOST}`

/** Public front-door (CloudFront) hostname of the dev Entry Gateway. */
export const DEV_RPC_HOST = 'dev.rpc.uniswap.org'
/** Public front-door (CloudFront) hostname of the staging Entry Gateway. */
export const STAGING_RPC_HOST = 'staging.rpc.uniswap.org'
/** Public front-door (CloudFront) hostname of the production Entry Gateway. */
export const PROD_RPC_HOST = 'rpc.uniswap.org'

/** Public front-door base URL of the dev Entry Gateway. */
export const DEV_RPC_API_BASE_URL: string = `https://${DEV_RPC_HOST}`
/** Public front-door base URL of the staging Entry Gateway. */
export const STAGING_RPC_API_BASE_URL: string = `https://${STAGING_RPC_HOST}`
/** Public front-door base URL of the production Entry Gateway. */
export const PROD_RPC_API_BASE_URL: string = `https://${PROD_RPC_HOST}`
