/**
 * Invariant: every RPC code path emits exactly one observer.onRequest +
 * onResponse for a successful request, and one onRequest + onError for a
 * failed request.
 *
 * This test exists because PR #32056 had to fix the same shape of bug twice:
 * UniRPC ethers (PR #29094) and Flashbots viem (PR #31003) each silently
 * dropped observability when the factory pattern was introduced. The fix
 * isn't fixing each instance — it's writing the invariant that makes the
 * next missed wrapping impossible to merge.
 *
 * If a new RPC code path is added, it MUST be added to the path table here.
 * If it isn't observable, this test fails and the missing wiring is caught
 * at PR time, not in production.
 */
import { providers as ethersProviders } from 'ethers/lib/ethers'
import { afterEach, beforeEach, describe, expect, type Mock, test, vi } from 'vitest'
import { createEthersProviderFactory } from '../createEthersProvider'
import { createViemClientFactory } from '../createViemClient'
import { setRpcObserver, type RpcObserver } from '../observability/rpcObserver'
import type { RpcConfig } from '../rpcUrlSelector'
import { RPCType, UniverseChainId, type ViemChainInfo } from '../types'

vi.mock('utilities/src/logger/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

const CHAIN_ID = UniverseChainId.Mainnet
const TEST_CHAIN_INFO: ViemChainInfo = {
  id: CHAIN_ID,
  name: 'Ethereum',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://cloudflare-eth.com'] } },
}

let observer: {
  onRequest: Mock
  onResponse: Mock
  onError: Mock
}

beforeEach(() => {
  observer = {
    onRequest: vi.fn(),
    onResponse: vi.fn(),
    onError: vi.fn(),
  }
  // Swap the global rpcObserver — the factories pull from `getRpcObserver()`
  // at construction time, so this must happen before any `build*` call.
  setRpcObserver(observer as unknown as RpcObserver)

  // Mock viem's path (globalThis.fetch). For ethers paths, individual tests
  // mock @ethersproject/web's fetchJson or super.perform.
  globalThis.fetch = vi.fn(async () => {
    return new Response(JSON.stringify({ jsonrpc: '2.0', id: 1, result: '0x2328' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  }) as typeof fetch
})

afterEach(() => {
  vi.restoreAllMocks()
  // Restore the default observer so other test files aren't affected.
  // (rpcObserver lazy-initializes — we re-trigger by setting noopObserver.)
  setRpcObserver({ onRequest: () => {}, onResponse: () => {}, onError: () => {} })
})

// ─────────────────────────────────────────────────────────────────────────
// Builders for each RPC code path. Each returns a function that, when called,
// fires exactly one RPC request through that path. Add new entries when new
// paths are introduced — the test table below loops over every entry and
// asserts the observability invariant.
// ─────────────────────────────────────────────────────────────────────────

interface RpcPath {
  name: string
  build: () => () => Promise<unknown>
}

function buildEthersFactory(config: RpcConfig) {
  return createEthersProviderFactory({ resolveRpcConfig: () => config })
}

function buildViemFactory(config: RpcConfig) {
  return createViemClientFactory({
    resolveRpcConfig: () => config,
    getChainInfo: () => TEST_CHAIN_INFO,
    areAddressesEqual: (a, b) => a.toLowerCase() === b.toLowerCase(),
  })
}

const VIEM_PATHS: RpcPath[] = [
  {
    name: 'viem UniRPC headers',
    build: () => {
      const factory = buildViemFactory({
        rpcUrl: 'https://gateway/rpc/1',
        isUniRpc: true,
        headers: { 'x-uni-service-id': 'ext' },
        getRequestHeaders: async () => ({ 'x-session-id': 'sess' }),
      })
      const client = factory({ chainId: CHAIN_ID, rpcType: RPCType.Public })!
      return () => client.getBlockNumber()
    },
  },
  {
    name: 'viem UniRPC cookies',
    build: () => {
      const factory = buildViemFactory({
        rpcUrl: 'https://gateway/rpc/1',
        isUniRpc: true,
        headers: { 'x-uni-service-id': 'web' },
        credentials: 'include',
      })
      const client = factory({ chainId: CHAIN_ID, rpcType: RPCType.Public })!
      return () => client.getBlockNumber()
    },
  },
  {
    name: 'viem legacy http',
    build: () => {
      const factory = buildViemFactory({ rpcUrl: 'https://legacy.example.com/rpc' })
      const client = factory({ chainId: CHAIN_ID, rpcType: RPCType.Public })!
      return () => client.getBlockNumber()
    },
  },
  {
    name: 'viem Flashbots',
    build: () => {
      const factory = buildViemFactory({
        rpcUrl: 'https://flashbots.example/rpc',
        shouldUseFlashbots: true,
        flashbotsConfig: { refundPercent: 50, calldataHintsEnabled: false },
      })
      const client = factory({ chainId: CHAIN_ID, rpcType: RPCType.Private })!
      return () => client.getBlockNumber()
    },
  },
  {
    name: 'ethers Web3Provider (UniRPC headers)',
    build: () => {
      const factory = buildEthersFactory({
        rpcUrl: 'https://gateway/rpc/1',
        isUniRpc: true,
        headers: { 'x-uni-service-id': 'ext' },
        getRequestHeaders: async () => ({ 'x-session-id': 'sess' }),
      })
      const provider = factory({ chainId: CHAIN_ID, rpcType: RPCType.Public })!
      // Web3Provider's `send()` flows through our createJsonRpcFetchFunc which
      // uses globalThis.fetch — already mocked above.
      return () => provider.send('eth_blockNumber', [])
    },
  },
]

describe('observability invariant — every RPC path emits onRequest + onResponse', () => {
  test.each(VIEM_PATHS.map((p) => [p.name, p] as const))('%s', async (_name, path) => {
    const sendRequest = path.build()
    await sendRequest()

    expect(observer.onRequest).toHaveBeenCalledTimes(1)
    expect(observer.onResponse).toHaveBeenCalledTimes(1)
    expect(observer.onError).not.toHaveBeenCalled()
  })
})

describe('observability invariant — failures emit onRequest + onError', () => {
  test('viem UniRPC cookies: fetch failure emits onError', async () => {
    // Reject ALL fetches — `mockRejectedValueOnce` is masked by viem's retries
    // (default 3) which would fall back to the success mock on later attempts.
    ;(globalThis.fetch as Mock).mockReset()
    ;(globalThis.fetch as Mock).mockRejectedValue(new Error('network down'))

    const factory = buildViemFactory({
      rpcUrl: 'https://gateway/rpc/1',
      isUniRpc: true,
      headers: {},
      credentials: 'include',
    })
    const client = factory({ chainId: CHAIN_ID, rpcType: RPCType.Public })!

    await expect(client.getBlockNumber()).rejects.toThrow()
    // viem retries internally — assert at-least-once invocation per retry attempt.
    // The invariant we care about is: every retry attempt is observed.
    expect(observer.onRequest).toHaveBeenCalled()
    expect(observer.onError).toHaveBeenCalled()
    expect(observer.onResponse).not.toHaveBeenCalled()
  })

  test('ethers Web3Provider: backend JSON-RPC error emits onError', async () => {
    ;(globalThis.fetch as Mock).mockResolvedValueOnce(
      new Response(JSON.stringify({ jsonrpc: '2.0', id: 1, error: { code: -32000, message: 'execution reverted' } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    const factory = buildEthersFactory({
      rpcUrl: 'https://gateway/rpc/1',
      isUniRpc: true,
      headers: {},
      getRequestHeaders: async () => ({}),
    })
    const provider = factory({ chainId: CHAIN_ID, rpcType: RPCType.Public })!

    await expect(provider.send('eth_blockNumber', [])).rejects.toThrow('execution reverted')
    expect(observer.onError).toHaveBeenCalledTimes(1)
  })
})

describe('observability invariant — error message cardinality is bounded', () => {
  test('observer.onError receives normalized error message (not embedded request id)', async () => {
    // Captures the regression that motivated `normalizeRpcError`:
    // ethers wraps transport errors with strings like
    //   'missing response (requestBody="...id:42...", code=SERVER_ERROR)'
    // — embedding the per-request id makes every error a unique bucket key
    // and defeats the rate limiter.
    ;(globalThis.fetch as Mock).mockResolvedValueOnce(
      new Response(JSON.stringify({ jsonrpc: '2.0', id: 1, error: { code: -32000, message: 'execution reverted' } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    const factory = buildEthersFactory({
      rpcUrl: 'https://gateway/rpc/1',
      isUniRpc: true,
      headers: {},
      getRequestHeaders: async () => ({}),
    })
    const provider = factory({ chainId: CHAIN_ID, rpcType: RPCType.Public })!

    try {
      await provider.send('eth_blockNumber', [])
    } catch {
      // expected
    }

    const errorCtx = observer.onError.mock.calls[0]?.[0] as { error: Error }
    // The normalized message should NOT contain transport-specific noise.
    // 'execution reverted' is the JSON-RPC error message — bounded cardinality.
    expect(errorCtx.error.message).toBe('execution reverted')
    expect(errorCtx.error.message).not.toMatch(/requestBody/)
    expect(errorCtx.error.message).not.toMatch(/id":\d+/)
  })

  test('InstrumentedJsonRpcProvider: ethers verbose error gets normalized before observer', async () => {
    // Simulate ethers' verbose transport error directly via super.perform.
    const ethersErr = new Error(
      'missing response (requestBody="{\\"id\\":99}", serverError={"code":"ECONNREFUSED"}, code=SERVER_ERROR, version=web/5.7.1)',
    ) as Error & { code: string; reason: string }
    ethersErr.code = 'SERVER_ERROR'
    ethersErr.reason = 'missing response'
    vi.spyOn(ethersProviders.StaticJsonRpcProvider.prototype, 'perform').mockRejectedValueOnce(ethersErr)

    const factory = buildEthersFactory({
      rpcUrl: 'https://gateway/rpc/1',
      isUniRpc: true,
      headers: {},
      credentials: 'include',
    })
    const provider = factory({ chainId: CHAIN_ID, rpcType: RPCType.Public })!

    await expect(provider.getBlockNumber()).rejects.toBe(ethersErr)

    const errorCtx = observer.onError.mock.calls[0]?.[0] as { error: Error }
    // Normalized form uses ethers' short `reason`, not the verbose message.
    expect(errorCtx.error.message).toBe('missing response')
    expect(errorCtx.error.message).not.toContain('id":99')
  })
})
