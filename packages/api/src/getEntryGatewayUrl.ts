import {
  DEV_ENTRY_GATEWAY_API_BASE_URL,
  PROD_ENTRY_GATEWAY_API_BASE_URL,
  STAGING_ENTRY_GATEWAY_API_BASE_URL,
} from '@universe/api/src/clients/base/urls'
import { getConfig } from '@universe/config'
import { isBetaEnv, isDevEnv } from 'utilities/src/environment/env'

/**
 * Returns the appropriate Entry Gateway API base URL based on the current environment.
 * When proxy is enabled, returns the proxy path. Otherwise returns the direct URL.
 * Can be overridden by setting ENTRY_GATEWAY_API_URL_OVERRIDE in environment variables.
 */
export function getEntryGatewayUrl(): string {
  const config = getConfig()

  // Use proxy path if enabled (for local development)
  if (config.enableEntryGatewayProxy) {
    return '/entry-gateway'
  }

  // Allow override via environment variable
  const override: string = config.entryGatewayApiUrlOverride
  if (override) {
    return override
  }

  // Determine URL based on environment
  let url: string
  if (isDevEnv()) {
    url = DEV_ENTRY_GATEWAY_API_BASE_URL
  } else if (isBetaEnv()) {
    url = STAGING_ENTRY_GATEWAY_API_BASE_URL
  } else {
    url = PROD_ENTRY_GATEWAY_API_BASE_URL
  }
  return url
}
