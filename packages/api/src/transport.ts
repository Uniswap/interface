import { type ConnectTransportOptions, createConnectTransport } from '@connectrpc/connect-web'
import { getDeviceIdService } from '@universe/api/src/getDeviceIdService'
import { getSessionStorage } from '@universe/api/src/getSessionStorage'
import { isWebApp } from 'utilities/src/platform'

interface SessionTransportOptions {
  getSessionId?: () => Promise<string | null>
  getDeviceId?: () => Promise<string | null>
  getBaseUrl: () => string
  getHeaders?: () => object
  options?: Partial<ConnectTransportOptions>
}

/**
 * Creates a Connect transport that includes session and device headers.
 *
 * This is the most basic transport util. Use this if you have a new use case for a transport.
 * (For example, a TestTransport that doesn't use the Session storage)
 * Otherwise, you can use the getTransport util.
 */
function createTransport(ctx: SessionTransportOptions): ReturnType<typeof createConnectTransport> {
  const { getSessionId, getDeviceId, getBaseUrl, getHeaders, options } = ctx

  const transportOptions: ConnectTransportOptions = {
    baseUrl: getBaseUrl(),
    interceptors: [
      (next) => async (request) => {
        // Add session ID header for mobile/extension
        // Web uses cookies automatically
        if (!isWebApp) {
          const [sessionId, deviceId] = await Promise.all([getSessionId?.(), getDeviceId?.()])
          if (sessionId) {
            request.header.set('X-Session-ID', sessionId)
          }
          if (deviceId) {
            request.header.set('X-Device-ID', deviceId)
          }
        }

        const extraHeaders = getHeaders?.()
        if (extraHeaders) {
          Object.entries(extraHeaders).forEach(([key, value]) => {
            request.header.set(key, value)
          })
        }

        return next(request)
      },
    ],
    ...options,
  }

  return createConnectTransport(transportOptions)
}

/**
 * Configures a Connect transport that uses the primary Session storage.
 */
function getTransport(ctx: {
  getBaseUrl: () => string
  getHeaders?: () => object
  options?: Partial<ConnectTransportOptions>
}): ReturnType<typeof createConnectTransport> {
  return createTransport({
    getBaseUrl: ctx.getBaseUrl,
    async getSessionId() {
      if (isWebApp) {
        return null
      }
      return getSessionStorage()
        .get()
        .then((session) => session?.sessionId ?? null)
    },
    async getDeviceId() {
      if (isWebApp) {
        return null
      }
      return getDeviceIdService().getDeviceId()
    },
    getHeaders: ctx.getHeaders,
    options: ctx.options,
  })
}

export { getTransport }
