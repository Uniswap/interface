import { createFetchClient, createForApiClient, provideSessionService } from '@universe/api'
import { FeatureFlags, getFeatureFlag } from '@universe/gating'
import { getForApiUrl } from 'uniswap/src/constants/urls'
import { getForApiHeaders } from 'uniswap/src/features/fiatOnRamp/constants'

/**
 * Singleton FetchClient for FOR API.
 *
 * This client uses getBaseUrl for dynamic URL resolution based on the ForUrlMigration feature flag.
 * The URL is resolved at request time (not at module load time) to support runtime flag changes.
 *
 * ## Feature Flags
 * - `ForUrlMigration` - Controls which URL endpoint to use
 * - `ForSessionsEnabled` - Controls whether session service is enabled for FOR API
 *
 * ## URL Resolution Priority
 * 1. `config.forApiUrlOverride` - Manual override via environment variable (highest priority)
 * 2. Feature flag enabled (ForUrlMigration) - New migrated URLs
 * 3. Feature flag disabled - Legacy URL structure
 *
 * ## Possible URLs
 *
 * ### When ForUrlMigration flag is ENABLED (new structure):
 * | Environment | URL                                                          |
 * |-------------|--------------------------------------------------------------|
 * | Dev/Beta    | https://for.backend-staging.api.uniswap.org/FOR.v1.FORService |
 * | Prod        | https://for.backend-prod.api.uniswap.org/FOR.v1.FORService    |
 *
 * ### When ForUrlMigration flag is DISABLED (legacy structure):
 * Uses the cloudflare gateway URL with v2 prefix.
 *
 * ### Environment variable override:
 * Set `FOR_API_URL_OVERRIDE` (or `REACT_APP_FOR_API_URL_OVERRIDE` for web) to use a custom URL.
 */
const ForApiFetchClient = createFetchClient({
  getBaseUrl: getForApiUrl,
  getHeaders: getForApiHeaders,
  getSessionService: () =>
    provideSessionService({
      getBaseUrl: getForApiUrl,
      getIsSessionServiceEnabled: () => getFeatureFlag(FeatureFlags.ForSessionsEnabled),
    }),
})

export const ForApiClient = createForApiClient({
  fetchClient: ForApiFetchClient,
})
