import {
  DEV_ENTRY_GATEWAY_API_BASE_URL,
  PROD_ENTRY_GATEWAY_API_BASE_URL,
  STAGING_ENTRY_GATEWAY_API_BASE_URL,
} from '@universe/api/src/clients/base/urls'
import { getConfig } from '@universe/config'
import { Environment, getCurrentEnv } from 'utilities/src/environment/getCurrentEnv'
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

  const environment = getCurrentEnv({
    isVercelEnvironment: config.isVercelEnvironment,
  })
  switch (environment) {
    case Environment.DEV:
      return DEV_ENTRY_GATEWAY_API_BASE_URL
    case Environment.STAGING:
      return STAGING_ENTRY_GATEWAY_API_BASE_URL
    case Environment.PROD:
      return PROD_ENTRY_GATEWAY_API_BASE_URL
    default:
      throw new Error(`Invalid environment: ${environment}`)
  }
}
