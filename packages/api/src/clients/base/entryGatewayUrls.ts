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
