import type { Transport } from '@connectrpc/connect'
import { createConnectTransport } from '@connectrpc/connect-web'

/**
 * Creates a test transport that simulates browser cookie behavior
 * for integration testing with real backends.
 */
export function createLocalCookieTransport(options: { baseUrl: string; cookieJar: Map<string, string> }): Transport {
  const { baseUrl, cookieJar } = options

  return createConnectTransport({
    baseUrl,
    credentials: 'include', // Tell backend we want cookies
    interceptors: [
      (next) => async (request) => {
        // Add required headers that backend expects
        request.header.set('x-request-source', 'uniswap-web')

        // Simulate browser cookie behavior: add stored cookies to request
        if (cookieJar.size > 0) {
          const cookieHeader = Array.from(cookieJar.entries())
            .map(([name, value]) => `${name}=${value}`)
            .join('; ')
          request.header.set('cookie', cookieHeader)
        }

        // Make the request
        const response = await next(request)

        // Simulate browser cookie behavior: store cookies from response
        for (const cookie of response.header.getSetCookie()) {
          const [nameValue] = cookie.split(';')
          if (nameValue) {
            const [name, value] = nameValue.split('=')
            if (name && value) {
              cookieJar.set(name.trim(), value.trim())
            }
          }
        }

        return response
      },
    ],
  })
}

/**
 * Creates a cookie jar for managing cookies in tests
 */
export function createCookieJar(): Map<string, string> {
  return new Map<string, string>()
}
