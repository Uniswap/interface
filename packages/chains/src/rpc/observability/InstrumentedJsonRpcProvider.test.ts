import { StaticJsonRpcProvider } from '@ethersproject/providers'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { InstrumentedJsonRpcProvider } from './InstrumentedJsonRpcProvider'
import type { RpcObserver } from './rpcObserver'

const noopObserver: RpcObserver = {
  onRequest: () => {},
  onResponse: () => {},
  onError: () => {},
}

afterEach(() => {
  vi.restoreAllMocks()
})

/**
 * The constructor builds a `ConnectionInfo` and passes it to ethers' parent.
 * We can't intercept the call to `super()` directly, but we can spy on the
 * StaticJsonRpcProvider's `connection` getter — ethers stores the resolved
 * ConnectionInfo on the instance.
 */
function getConnection(provider: InstrumentedJsonRpcProvider): {
  url?: string
  headers?: Record<string, string | number>
  fetchOptions?: { credentials?: string }
} {
  // ethers stores the resolved connection on the public `connection` getter
  return (provider as unknown as { connection: never }).connection
}

describe('InstrumentedJsonRpcProvider', () => {
  test('passes credentials:include via fetchOptions when supplied', () => {
    // Cookie-based UniRPC session auth on web. Without `fetchOptions.credentials`,
    // ethers' default `same-origin` drops cookies cross-origin, silently
    // breaking ENS/portfolio/gas resolution against the entry gateway.
    const provider = new InstrumentedJsonRpcProvider({
      url: 'https://entry-gateway.api.uniswap.org/rpc/1',
      headers: { 'x-uni-service-id': 'uniswap-web' },
      credentials: 'include',
      chainIdOrNetwork: 1,
      observer: noopObserver,
    })

    const connection = getConnection(provider)
    expect(connection.fetchOptions?.credentials).toBe('include')
    expect(connection.headers?.['x-uni-service-id']).toBe('uniswap-web')
  })

  test('omits fetchOptions when no credentials supplied', () => {
    const provider = new InstrumentedJsonRpcProvider({
      url: 'https://example.com/rpc',
      headers: { 'x-uni-service-id': 'uniswap-web' },
      chainIdOrNetwork: 1,
      observer: noopObserver,
    })

    const connection = getConnection(provider)
    expect(connection.fetchOptions).toBeUndefined()
    expect(connection.headers?.['x-uni-service-id']).toBe('uniswap-web')
  })

  test('uses bare URL when neither headers nor credentials present (legacy path)', () => {
    const provider = new InstrumentedJsonRpcProvider({
      url: 'https://legacy.example.com/rpc',
      chainIdOrNetwork: 1,
      observer: noopObserver,
    })

    // ethers normalizes a string URL into ConnectionInfo internally — the
    // assertion is that we didn't accidentally introduce fetchOptions when
    // the caller passes neither headers nor credentials.
    const connection = getConnection(provider)
    expect(connection.fetchOptions).toBeUndefined()
    expect(connection.url).toBe('https://legacy.example.com/rpc')
  })

  test('emits normalized error message on observer.onError (not raw ethers wrapped form)', async () => {
    const observer: RpcObserver = {
      onRequest: vi.fn(),
      onResponse: vi.fn(),
      onError: vi.fn(),
    }

    // Simulate ethers' verbose transport-level error — this is what
    // `super.perform()` throws when fetch fails. The raw message embeds
    // per-request fields (id, body, url) that defeat bucket-by-message
    // rate limiting if passed through unmodified.
    const ethersErr = new Error(
      'missing response (requestBody="{\\"id\\":42}", code=SERVER_ERROR, version=web/5.7.1)',
    ) as Error & { code: string; reason: string }
    ethersErr.code = 'SERVER_ERROR'
    ethersErr.reason = 'missing response'

    vi.spyOn(StaticJsonRpcProvider.prototype, 'perform').mockRejectedValueOnce(ethersErr)

    const provider = new InstrumentedJsonRpcProvider({
      url: 'https://entry-gateway.api.uniswap.org/rpc/1',
      headers: { 'x-uni-service-id': 'uniswap-web' },
      chainIdOrNetwork: 1,
      observer,
    })

    await expect(provider.perform('eth_blockNumber', {})).rejects.toBe(ethersErr)

    expect(observer.onError).toHaveBeenCalledTimes(1)
    const observed = (observer.onError as ReturnType<typeof vi.fn>).mock.calls[0]?.[0]
    expect(observed).toBeDefined()
    const normalized = observed!.error as Error
    // Normalized message should be ethers' short `reason`, not the verbose
    // form with embedded request id.
    expect(normalized.message).toBe('missing response')
    expect(normalized.message).not.toContain('id":42')
  })

  test('throws original ethers error so callers preserve full ethers shape', async () => {
    const ethersErr = new Error('outer') as Error & { error: { message: string; code: number } }
    ethersErr.error = { message: 'execution reverted', code: -32000 }

    vi.spyOn(StaticJsonRpcProvider.prototype, 'perform').mockRejectedValueOnce(ethersErr)

    const provider = new InstrumentedJsonRpcProvider({
      url: 'https://example.com/rpc',
      chainIdOrNetwork: 1,
      observer: noopObserver,
    })

    // The error that propagates to the caller is the original ethers wrapper —
    // not the normalized form. Downstream code may key on .error, .code, etc.
    await expect(provider.perform('eth_call', {})).rejects.toBe(ethersErr)
  })
})
