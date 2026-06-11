import { type ConnectTransportOptions, createConnectTransport } from '@connectrpc/connect-web'

export type Interceptors = NonNullable<ConnectTransportOptions['interceptors']>
import { provideDeviceIdService } from '@universe/api/src/provideDeviceIdService'
import { provideSessionStorage } from '@universe/api/src/provideSessionStorage'
import { isWebApp } from '@universe/environment'
import type { Session } from '@universe/sessions'
import { requireSessionInterceptor } from '@universe/sessions'
import { logger, type Logger } from 'utilities/src/logger/logger'

interface SessionTransportOptions {
  getSessionId?: () => Promise<string | null>
  getDeviceId?: () => Promise<string | null>
  getBaseUrl: () => string
  getHeaders?: () => object
  /** Additional interceptors (run after the built-in header injection interceptor) */
  interceptors?: Interceptors
  /**
   * Optional session gate. When the getter returns a Session, calls are
   * gated with await-ready + retry-once on 401. Returning null (not
   * bootstrapped) passes through. The interceptor always skips the
   * SessionService itself to avoid a recovery deadlock.
   */
  getSession?: () => Session | null
  /**
   * Telemetry identifier for the gate's emitted events. Defaults to
   * `'connect-rpc'` in `createTransport`, so it's always populated even when
   * `getSession` is set — no separate enforcement needed.
   */
  source?: string
  getLogger?: () => Logger
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
  const {
    getSessionId,
    getDeviceId,
    getBaseUrl,
    getHeaders,
    interceptors: extraInterceptors,
    getSession,
    source = 'connect-rpc',
    getLogger = (): Logger => logger,
    options,
  } = ctx

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
      ...(getSession ? [requireSessionInterceptor({ getSession, source, getLogger })] : []),
      ...(extraInterceptors ?? []),
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
  interceptors?: Interceptors
  getSession?: () => Session | null
  source?: string
  getLogger?: () => Logger
  options?: Partial<ConnectTransportOptions>
}): ReturnType<typeof createConnectTransport> {
  return createTransport({
    getBaseUrl: ctx.getBaseUrl,
    async getSessionId() {
      if (isWebApp) {
        return null
      }
      return provideSessionStorage()
        .get()
        .then((session) => session?.sessionId ?? null)
    },
    async getDeviceId() {
      if (isWebApp) {
        return null
      }
      return provideDeviceIdService().getDeviceId()
    },
    getHeaders: ctx.getHeaders,
    interceptors: ctx.interceptors,
    getSession: ctx.getSession,
    source: ctx.source,
    getLogger: ctx.getLogger,
    options: ctx.options,
  })
}

export { getTransport }
