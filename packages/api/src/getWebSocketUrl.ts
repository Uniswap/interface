import { PROD_WEBSOCKET_BASE_URL, STAGING_WEBSOCKET_BASE_URL } from '@universe/api/src/clients/base/urls'
import { getConfig } from '@universe/config'
import { Environment, getCurrentEnv } from 'utilities/src/environment/getCurrentEnv'

/**
 * Returns the appropriate WebSocket URL based on the current environment.
 * When the entry gateway proxy is enabled, returns the BFF proxy path so the
 * Cloudflare Worker or Vercel edge function can forward the connection with
 * correct cookies/origin.
 */
export function getWebSocketUrl(): string {
  const config = getConfig()

  if (config.enableEntryGatewayProxy) {
    return '/ws'
  }

  const environment = getCurrentEnv({ isVercelEnvironment: config.isVercelEnvironment })
  switch (environment) {
    case Environment.DEV:
    case Environment.STAGING:
      return STAGING_WEBSOCKET_BASE_URL as string
    case Environment.PROD:
      return PROD_WEBSOCKET_BASE_URL as string
    default:
      throw new Error(`Invalid environment: ${environment}`)
  }
}
