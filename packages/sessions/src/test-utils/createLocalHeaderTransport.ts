import type { Transport } from '@connectrpc/connect'
import { createConnectTransport } from '@connectrpc/connect-web'

interface CreateLocalHeaderTransportOptions {
  baseUrl: string
  requestSource: 'uniswap-ios' | 'uniswap-android' | 'uniswap-extension'
  getSessionId: () => Promise<string | null>
  getDeviceId: () => Promise<string | null>
}

/**
 * Creates a test transport that simulates native app behavior
 * for integration testing with real backends.
 *
 * Unlike web which uses cookies, native platforms send session
 * and device IDs via headers on every request.
 */
export function createLocalHeaderTransport(options: CreateLocalHeaderTransportOptions): Transport {
  const { baseUrl, requestSource, getSessionId, getDeviceId } = options

  return createConnectTransport({
    baseUrl,
    // NO credentials: 'include' - native platforms don't use cookies
    interceptors: [
      (next) => async (request) => {
        // Add platform-specific request source header
        request.header.set('x-request-source', requestSource)

        // Add session ID header if available
        const sessionId = await getSessionId()
        if (sessionId) {
          request.header.set('X-Session-ID', sessionId)
        }

        // Add device ID header if available
        const deviceId = await getDeviceId()
        if (deviceId) {
          request.header.set('X-Device-ID', deviceId)
        }

        return next(request)
      },
    ],
  })
}
