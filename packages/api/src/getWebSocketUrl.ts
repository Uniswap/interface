import { getConfig } from '@universe/config'
import { getEntryGatewayUrl } from './getEntryGatewayUrl'

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
    return '/ws'
  }

  return toWebSocketUrl(getEntryGatewayUrl())
}
