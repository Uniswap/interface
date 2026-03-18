import {
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
/**
 * Get the FOR API URL routed through the Entry Gateway.
 * Delegates to getEntryGatewayUrl() and appends the FOR service path.
 */
export function getMigratedForApiUrl(): string {
  return `${getEntryGatewayUrl()}/FOR.v1.FORService`
}

export function getEntryGatewayUrl(): string {
  const config = getConfig()

  // Use proxy path if enabled (local dev, Vercel previews, or explicit opt-in)
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
    case Environment.DEV: // Dev also currently uses staging builds, as for many features staging is more stable / less prone to breaking testing changes.
    case Environment.STAGING:
      return STAGING_ENTRY_GATEWAY_API_BASE_URL
    case Environment.PROD:
      return PROD_ENTRY_GATEWAY_API_BASE_URL
    default:
      throw new Error(`Invalid environment: ${environment}`)
  }
}
