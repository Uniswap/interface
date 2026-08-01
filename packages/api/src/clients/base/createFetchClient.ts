import { FetchError } from '@universe/api/src/clients/base/errors'
import type {
  CustomOptions,
  FetchClient,
  FetchClientContext,
  StandardFetchOptions,
} from '@universe/api/src/clients/base/types'
import { requireSessionFetch } from '@universe/sessions'
import { logger, type Logger } from 'utilities/src/logger/logger'

export function createFetchClient({
  baseUrl,
  getBaseUrl,
  getHeaders,
  onResponse,
  getSessionService,
  getSession,
  source = 'fetch',
  getLogger = (): Logger => logger,
  defaultOptions = {},
}: FetchClientContext): FetchClient {
  // Helper to resolve the base URL - prefers getBaseUrl for dynamic resolution
  const resolveBaseUrl = (): string => getBaseUrl?.() ?? baseUrl ?? ''

  // Resolve `x-session-id` *per underlying request* so the gate's post-recovery
  // retry carries the freshly-recovered id, not the stale one captured before
  // the first attempt. Web uses cookies (no header); mobile sends the header.
  const sessionIdFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const sessionState = await getSessionService().getSessionState()
    const headers = new Headers(init?.headers)
    if (sessionState?.sessionId) {
      headers.set('x-session-id', sessionState.sessionId)
    }
    return fetch(input, { ...init, headers })
  }

  // No-op when getSession returns null; awaits ready + retries once on 401 otherwise.
  const doFetch = requireSessionFetch({ getSession: getSession ?? ((): null => null), source, getLogger })(
    sessionIdFetch,
  )

  return {
    get context() {
      return () => {
        return {
          baseUrl: resolveBaseUrl(),
          getBaseUrl,
          getHeaders,
          onResponse,
          getSessionService,
          getSession,
          defaultOptions,
        }
      }
    },

    get fetch() {
      return async <T = Response>(path: string, options: StandardFetchOptions): Promise<T> => {
        const additionalHeaders = getHeaders?.() ?? {}

        // `x-session-id` is injected by `sessionIdFetch` per attempt — not here —
        // so it stays correct across the gate's recover-and-retry.
        const headers = new Headers({
          // oxlint-disable-next-line typescript-eslint/no-misused-spread
          ...additionalHeaders,
          // oxlint-disable-next-line typescript-eslint/no-misused-spread
          ...options?.headers,
        })
        const response = await doFetch(`${resolveBaseUrl()}${path}`, {
          ...defaultOptions,
          ...options,
          headers,
        })
        // Surface the raw Response (headers only) before any body read downstream.
        onResponse?.(response)
        return response as T
      }
    },

    get get() {
      return async <T>(path: string, options?: CustomOptions): Promise<T> => {
        if (options?.params) {
          const searchParams = new URLSearchParams()
          for (const [key, value] of Object.entries(options.params)) {
            if (value !== undefined && value !== null) {
              searchParams.append(key, value.toString())
            }
          }
          path += '?' + searchParams.toString()
        }

        const { on404, ...standardOptions } = options ?? {}

        const response = await this.fetch(path, standardOptions)

        if (on404 && response.status === 404) {
          on404()
        }

        if (!response.ok) {
          let data: object | undefined
          try {
            data = await response.json()
          } catch (e) {
            throw new FetchError({ response, cause: e })
          }
          throw new FetchError({ response, data })
        }

        return (await response.json()) as T
      }
    },

    get post() {
      return async <T>(path: string, options: CustomOptions): Promise<T> => {
        const _options = options

        _options.headers = {
          'Content-Type': 'application/json',
          // oxlint-disable-next-line typescript-eslint/no-misused-spread
          ...options.headers,
        }

        return (await this.get(path, { ..._options, method: 'POST' })) as T
      }
    },

    get put() {
      return async <T>(path: string, options: CustomOptions): Promise<T> => {
        const _options = options

        _options.headers = {
          'Content-Type': 'application/json',
          // oxlint-disable-next-line typescript-eslint/no-misused-spread
          ...options.headers,
        }

        return (await this.get(path, { ..._options, method: 'PUT' })) as T
      }
    },

    get delete() {
      return async <T>(path: string, options: CustomOptions = {}): Promise<T> => {
        return (await this.get(path, { ...options, method: 'DELETE' })) as T
      }
    },

    get patch() {
      return async <T>(path: string, options: CustomOptions): Promise<T> => {
        const _options = options

        _options.headers = {
          'Content-Type': 'application/json',
          // oxlint-disable-next-line typescript-eslint/no-misused-spread
          ...options.headers,
        }

        return await this.get(path, { ..._options, method: 'PATCH' })
      }
    },
  }
}
