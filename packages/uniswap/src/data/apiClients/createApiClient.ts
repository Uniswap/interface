import { uniswapUrls } from 'uniswap/src/constants/urls'
import { FetchError } from 'uniswap/src/data/apiClients/FetchError'
import { REQUEST_SOURCE, getVersionHeader } from 'uniswap/src/data/constants'
import { isMobileApp } from 'utilities/src/platform'

export const BASE_UNISWAP_HEADERS = {
  'x-request-source': REQUEST_SOURCE,
  'x-app-version': getVersionHeader(),
  ...(isMobileApp ? { Origin: uniswapUrls.apiOrigin } : {}),
}

export function createApiClient({
  baseUrl,
  includeBaseUniswapHeaders = true,
  additionalHeaders = {},
}: {
  baseUrl: string
  includeBaseUniswapHeaders?: boolean
  additionalHeaders?: HeadersInit
}): {
  readonly fetch: (path: string, options: Parameters<typeof fetch>[1]) => Promise<Response>
  readonly get: <T>(
    path: string,
    options?: Parameters<typeof fetch>[1] & {
      params?: Record<string, string | number | boolean | undefined | null>
    },
  ) => Promise<T>
  readonly post: <T>(path: string, options: Parameters<typeof fetch>[1]) => Promise<T>
} {
  const headers = includeBaseUniswapHeaders ? { ...BASE_UNISWAP_HEADERS, ...additionalHeaders } : additionalHeaders

  return {
    get fetch() {
      return (path: string, options: Parameters<typeof fetch>[1]) => {
        return fetch(`${baseUrl}${path}`, {
          ...options,
          headers: {
            ...headers,
            ...options?.headers,
          },
        })
      }
    },

    get get() {
      return async <T>(
        path: string,
        options?: Parameters<typeof fetch>[1] & {
          params?: Record<string, string | number | boolean | undefined | null>
        },
      ): Promise<T> => {
        if (options?.params) {
          const searchParams = new URLSearchParams()
          for (const [key, value] of Object.entries(options.params)) {
            if (value !== undefined && value !== null) {
              searchParams.append(key, value.toString())
            }
          }
          path += '?' + searchParams.toString()
        }

        const response = await this.fetch(path, options)

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
      return async <T>(path: string, options?: Parameters<typeof fetch>[1]): Promise<T> => {
        const _options = options ?? {}

        _options.headers = {
          'Content-Type': 'application/json',
          ...(options?.headers ?? {}),
        }

        return await this.get(path, { ..._options, method: 'POST' })
      }
    },
  }
}
