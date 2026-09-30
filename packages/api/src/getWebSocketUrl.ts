import { ENTRY_GATEWAY_API_BASE_URLS } from '@universe/api/src/clients/base/urls'
import { getEntryGatewayUrl } from '@universe/api/src/getEntryGatewayUrl'
import { getConfig } from '@universe/config'
import { getCurrentEnv } from '@universe/environment'

function toWebSocketUrl(httpBaseUrl: string): string {
  return `${httpBaseUrl.replace('https:', 'wss:')}/ws`
}

/**
 * Socket opens against the same entry gateway host as REST — the session cookie is host-only,
 * and the gateway authenticates and proxies through to the websockets service.
 */
export function getWebSocketUrl(): string {
  const config = getConfig()

  if (config.enableEntryGatewayProxy) {
    if (!config.isVercelEnvironment) {
      return '/ws'
    }
    // Vercel can't proxy WS, so previews connect directly and fall back to REST pricing.
    return toWebSocketUrl(ENTRY_GATEWAY_API_BASE_URLS[getCurrentEnv({ isVercelEnvironment: true })])
  }

  return toWebSocketUrl(getEntryGatewayUrl())
}
