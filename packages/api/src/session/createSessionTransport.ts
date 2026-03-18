import { type ConnectTransportOptions, createConnectTransport } from '@connectrpc/connect-web'

/**
 * Options for creating a session transport.
 * All configuration is explicit - no platform detection.
 */
export interface CreateSessionTransportOptions {
  /** Entry gateway URL */
  baseUrl: string

  /** Static headers to include in all requests (e.g., x-request-source, x-uniswap-timezone) */
  headers?: Record<string, string>

  /** Cookie header for SSR forwarding */
  cookie?: string

  /** Use browser credentials for automatic cookie handling (for web with cookies) */
  credentials?: 'include' | 'omit' | 'same-origin'

  /** Dynamic session ID getter (for mobile/extension that use headers instead of cookies) */
  getSessionId?: () => Promise<string | null>

  /** Dynamic device ID getter (for mobile/extension that use headers instead of cookies) */
  getDeviceId?: () => Promise<string | null>

  /** Additional ConnectRPC transport options */
  transportOptions?: Partial<ConnectTransportOptions>
}

/**
 * Creates a ConnectRPC transport with explicit configuration.
 *
 * This is a pure factory function with no platform detection.
 * The caller (app-level provider) is responsible for providing
 * the correct configuration for their platform/context.
 *
 * @example
 * // Web browser - uses cookies automatically
 * const transport = createSessionTransport({
 *   baseUrl: entryGatewayUrl,
 *   credentials: 'include',
 *   headers: {
 *     'x-request-source': 'uniswap-web',
 *     'x-uniswap-timezone': Intl.DateTimeFormat().resolvedOptions().timeZone,
 *   },
 * })
 *
 * @example
 * // SSR - forwards cookies from incoming request
 * const transport = createSessionTransport({
 *   baseUrl: config.entryGatewayUrl,
 *   cookie: request.headers.get('Cookie'),
 *   headers: {
 *     'x-request-source': 'uniswap-web',
 *     'x-uniswap-timezone': timezone,
 *   },
 * })
 *
 * @example
 * // Mobile - uses headers for session/device IDs
 * const transport = createSessionTransport({
 *   baseUrl: entryGatewayUrl,
 *   headers: { 'x-request-source': 'uniswap-mobile' },
 *   getSessionId: () => sessionStorage.get().then(s => s?.sessionId ?? null),
 *   getDeviceId: () => deviceIdService.getDeviceId(),
 * })
 */
export function createSessionTransport(
  options: CreateSessionTransportOptions,
): ReturnType<typeof createConnectTransport> {
  const { baseUrl, headers, cookie, credentials, getSessionId, getDeviceId, transportOptions } = options

  return createConnectTransport({
    baseUrl,
    credentials,
    interceptors: [
      (next) => async (request) => {
        if (headers) {
          for (const [key, value] of Object.entries(headers)) {
            request.header.set(key, value)
          }
        }

        if (cookie) {
          request.header.set('Cookie', cookie)
        }

        if (getSessionId) {
          const sessionId = await getSessionId()
          if (sessionId) {
            request.header.set('X-Session-ID', sessionId)
          }
        }

        if (getDeviceId) {
          const deviceId = await getDeviceId()
          if (deviceId) {
            request.header.set('X-Device-ID', deviceId)
          }
        }

        return next(request)
      },
    ],
    ...transportOptions,
  })
}
