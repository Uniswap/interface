// TODO(entry-gateway-urls): duplicated from the canonical definition in
// packages/api/src/clients/base/entryGatewayUrls.ts — @universe/api depends on
// @universe/sessions, so importing it here would create a package cycle. Keep in sync.
// This is the ONLY entry-gateway literal allowed in this package outside
// createTestSessionContext.ts (same cycle carve-out); import it everywhere else.

/** Entry Gateway base URL for the staging backend environment. */
export const STAGING_ENTRY_GATEWAY_API_BASE_URL = 'https://entry-gateway.backend-staging.api.uniswap.org'
