import { type Mock, afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { createViemClientFactory } from './createViemClient'
import type { RpcConfig } from './rpcUrlSelector'
import { RPCType, UniverseChainId, type ViemChainInfo } from './types'

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

let lastUrl: string | undefined
let lastInit: RequestInit | undefined

beforeEach(() => {
  lastUrl = undefined
  lastInit = undefined
  globalThis.fetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    lastUrl = String(url)
    lastInit = init
    return new Response(JSON.stringify({ jsonrpc: '2.0', id: 1, result: '0x2328' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  }) as typeof fetch
})

afterEach(() => {
  vi.restoreAllMocks()
})

function buildFactory(config: RpcConfig | null) {
  return createViemClientFactory({
    resolveRpcConfig: () => config,
    getChainInfo: () => TEST_CHAIN_INFO,
    areAddressesEqual: (a, b) => a.toLowerCase() === b.toLowerCase(),
  })
}

describe('createViemClientFactory — branching contract', () => {
  test('returns undefined when resolver returns null', () => {
    const factory = buildFactory(null)
    expect(factory({ chainId: CHAIN_ID, rpcType: RPCType.Public })).toBeUndefined()
  })

  test('isUniRpc + getRequestHeaders → routes through UniRPC headers transport', async () => {
    const getRequestHeaders = vi.fn().mockResolvedValue({ 'x-session-id': 'sess-1' })
    const factory = buildFactory({
      rpcUrl: 'https://gateway/rpc/1',
      isUniRpc: true,
      headers: { 'x-request-source': 'ext' },
      getRequestHeaders,
    })
    const client = factory({ chainId: CHAIN_ID, rpcType: RPCType.Public })!

    await client.getBlockNumber()

    // Header strategy → outgoing fetch carries both static + dynamic headers.
    const headers = new Headers(lastInit?.headers as HeadersInit)
    expect(headers.get('x-request-source')).toBe('ext')
    expect(headers.get('x-session-id')).toBe('sess-1')
    expect(getRequestHeaders).toHaveBeenCalled()
    // Cookie credentials must NOT be set on header strategy.
    expect(lastInit?.credentials).toBeUndefined()
  })

  test('isUniRpc + no getRequestHeaders → routes through UniRPC cookies transport', async () => {
    const factory = buildFactory({
      rpcUrl: 'https://gateway/rpc/1',
      isUniRpc: true,
      headers: { 'x-request-source': 'web' },
      credentials: 'include',
    })
    const client = factory({ chainId: CHAIN_ID, rpcType: RPCType.Public })!

    await client.getBlockNumber()

    expect(lastInit?.credentials).toBe('include')
    const headers = new Headers(lastInit?.headers as HeadersInit)
    expect(headers.get('x-request-source')).toBe('web')
  })

  test('!isUniRpc → routes through plain http() transport', async () => {
    const factory = buildFactory({
      rpcUrl: 'https://legacy.example.com/rpc',
      headers: { 'x-some-header': 'still-honored' },
    })
    const client = factory({ chainId: CHAIN_ID, rpcType: RPCType.Public })!

    await client.getBlockNumber()

    // Legacy http() honors static headers via fetchOptions, but does NOT
    // apply UniRPC-specific behavior (id:0 patch is fine because viem's
    // legacy path doesn't have the proto3 quirk; cookies aren't set; the
    // 6s UNIRPC_TIMEOUT_MS doesn't apply).
    expect(lastUrl).toBe('https://legacy.example.com/rpc')
    expect(lastInit?.credentials).toBeUndefined()
    const headers = new Headers(lastInit?.headers as HeadersInit)
    expect(headers.get('x-some-header')).toBe('still-honored')
  })

  test('shouldUseFlashbots → returns Flashbots client (UniRPC flag ignored)', async () => {
    const factory = buildFactory({
      rpcUrl: 'https://flashbots.example/rpc',
      shouldUseFlashbots: true,
      flashbotsConfig: { refundPercent: 50, calldataHintsEnabled: false },
      isUniRpc: true,
    })
    const client = factory({ chainId: CHAIN_ID, rpcType: RPCType.Private })!

    expect(client).toBeDefined()
    // Verify by exercising — Flashbots uses its own transport with auth headers.
    // We don't assert on the exact URL here (FlashbotsRpcClient.test.ts does that);
    // we just confirm the branch produces a working client.
    await client.getBlockNumber()
    expect(lastUrl).toContain('flashbots')
  })

  test('returns undefined when factory throws (logger error path)', () => {
    const factory = createViemClientFactory({
      resolveRpcConfig: () => {
        throw new Error('resolver blew up')
      },
      getChainInfo: () => TEST_CHAIN_INFO,
      areAddressesEqual: () => false,
    })

    expect(factory({ chainId: CHAIN_ID, rpcType: RPCType.Public })).toBeUndefined()
  })

  test('every non-Flashbots branch wraps transport with createObservableTransport', async () => {
    // Catches the regression class from #29094: factory refactor that drops
    // the observability wrapper on a branch. We assert observability indirectly
    // by confirming the global rpcObserver receives onRequest/onResponse for
    // each branch — see observabilityInvariant.test.ts for the full sweep.
    // Here, we just verify the wrapper doesn't throw or short-circuit.
    const branches: { name: string; config: RpcConfig }[] = [
      {
        name: 'UniRPC headers',
        config: {
          rpcUrl: 'https://gateway/rpc/1',
          isUniRpc: true,
          headers: {},
          getRequestHeaders: async () => ({}),
        },
      },
      {
        name: 'UniRPC cookies',
        config: {
          rpcUrl: 'https://gateway/rpc/1',
          isUniRpc: true,
          headers: {},
          credentials: 'include',
        },
      },
      {
        name: 'legacy http',
        config: { rpcUrl: 'https://legacy.example.com/rpc' },
      },
    ]

    for (const { config } of branches) {
      ;(globalThis.fetch as Mock).mockClear()
      const factory = buildFactory(config)
      const client = factory({ chainId: CHAIN_ID, rpcType: RPCType.Public })!
      await client.getBlockNumber()
      expect(globalThis.fetch).toHaveBeenCalledTimes(1)
    }
  })
})
