import type { Session, SessionService } from '@universe/sessions'
import type { Logger } from 'utilities/src/logger/logger'

export type StandardFetchOptions = Parameters<typeof fetch>[1]

export type CustomOptions = StandardFetchOptions & {
  params?: Record<string, string | number | boolean | undefined | null>
  on404?: () => void
}

export interface FetchClientContext {
  baseUrl?: string
  getBaseUrl?: () => string
  getHeaders?: () => HeadersInit
  /**
   * Invoked with the raw `Response` of every completed request, before its body is read.
   * For reading response headers (e.g. correlation headers echoed by the backend); must not
   * consume the body. Errors thrown here are not caught — keep it cheap and total.
   */
  onResponse?: (response: Response) => void
  getSessionService: () => SessionService
  /**
   * Optional session gate. When the getter returns a Session, fetch calls
   * are gated with await-ready + retry-once on 401. Returning null (not
   * bootstrapped) passes through.
   */
  getSession?: () => Session | null
  /** Telemetry identifier for the gate's emitted events. */
  source?: string
  getLogger?: () => Logger
  defaultOptions?: Omit<StandardFetchOptions, 'headers'>
}

export interface FetchClient {
  readonly context: () => FetchClientContext
  readonly fetch: <T = Response>(path: string, options: StandardFetchOptions) => Promise<T>
  readonly get: <T>(path: string, options?: CustomOptions) => Promise<T>
  readonly post: <T>(path: string, options: CustomOptions) => Promise<T>
  readonly put: <T>(path: string, options: CustomOptions) => Promise<T>
  readonly delete: <T>(path: string, options: CustomOptions) => Promise<T>
  readonly patch: <T>(path: string, options: CustomOptions) => Promise<T>
}
