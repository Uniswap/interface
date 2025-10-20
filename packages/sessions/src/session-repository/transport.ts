import { type ConnectTransportOptions, createConnectTransport } from '@connectrpc/connect-web'
import { isWebApp } from 'utilities/src/platform'

interface SessionTransportOptions {
  getSessionId?: () => Promise<string | null>
  getDeviceId?: () => Promise<string | null>
  getBaseUrl: () => string
}

export function createTransport(ctx: SessionTransportOptions): ReturnType<typeof createConnectTransport> {
  const { getSessionId, getDeviceId, getBaseUrl } = ctx

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
        return next(request)
      },
    ],
    // Include credentials for cookie support on web
    // Note: this causes CORS errors when running web locally
    // TODO(app-infra): Re-enable this when we have a solution
    // credentials: isWebApp ? 'include' : 'omit',
  }

  return createConnectTransport(transportOptions)
}
