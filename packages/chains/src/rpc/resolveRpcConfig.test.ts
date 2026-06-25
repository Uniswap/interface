import { describe, expect, test } from 'vitest'
import { createRpcConfigResolver } from './resolveRpcConfig'
import type { RpcConfig } from './rpcUrlSelector'
import { RPCType, UniverseChainId } from './types'

const ENTRY_GATEWAY = 'https://entry-gateway.test.uniswap.org'

const getRequestHeaders = async (): Promise<Record<string, string>> => ({
  'X-Session-ID': 'session-123',
  'X-Device-ID': 'device-123',
})

// Mirrors the platform wiring (native/web): promote an entry-gateway URL the legacy
// path returns so it carries session auth.
const asUniRpcConfig = (config: RpcConfig): RpcConfig =>
  config.rpcUrl.startsWith(`${ENTRY_GATEWAY}/rpc/`)
    ? { ...config, isUniRpc: true, headers: { 'x-request-source': 'test', ...config.headers }, getRequestHeaders }
    : config

describe('createRpcConfigResolver', () => {
  test('promotes a legacy-path entry-gateway URL to authenticated UniRPC (gate off / pre-Statsig)', () => {
    const resolve = createRpcConfigResolver({
      resolveUniRpcConfig: () => null,
      selectLegacyRpcUrl: (chainId) => ({ rpcUrl: `${ENTRY_GATEWAY}/rpc/${chainId}` }),
      asUniRpcConfig,
    })

    const config = resolve({ chainId: UniverseChainId.Mainnet, rpcType: RPCType.Public })

    // The original bug: this came back without isUniRpc/getRequestHeaders → 401.
    expect(config?.isUniRpc).toBe(true)
    expect(config?.getRequestHeaders).toBe(getRequestHeaders)
  })

  test('leaves a non-entry-gateway legacy URL unauthenticated', () => {
    const resolve = createRpcConfigResolver({
      resolveUniRpcConfig: () => null,
      selectLegacyRpcUrl: () => ({ rpcUrl: 'https://example.quiknode.pro/key' }),
      asUniRpcConfig,
    })

    const config = resolve({ chainId: UniverseChainId.Mainnet, rpcType: RPCType.Public })

    expect(config?.isUniRpc).toBeUndefined()
    expect(config?.getRequestHeaders).toBeUndefined()
  })

  test('prefers the primary UniRPC config when the gate is on', () => {
    const resolve = createRpcConfigResolver({
      resolveUniRpcConfig: ({ chainId }) => ({
        rpcUrl: `${ENTRY_GATEWAY}/rpc/${chainId}`,
        headers: {},
        getRequestHeaders,
      }),
      selectLegacyRpcUrl: () => ({ rpcUrl: 'https://should-not-be-used.example' }),
      asUniRpcConfig,
    })

    const config = resolve({ chainId: UniverseChainId.Mainnet, rpcType: RPCType.Public })

    expect(config?.isUniRpc).toBe(true)
    expect(config?.rpcUrl).toBe(`${ENTRY_GATEWAY}/rpc/${UniverseChainId.Mainnet}`)
  })

  test('does not route Private RPC through UniRPC', () => {
    const resolve = createRpcConfigResolver({
      resolveUniRpcConfig: () => ({ rpcUrl: `${ENTRY_GATEWAY}/rpc/1`, headers: {}, getRequestHeaders }),
      selectLegacyRpcUrl: () => ({ rpcUrl: 'https://private.example' }),
      asUniRpcConfig,
    })

    const config = resolve({ chainId: UniverseChainId.Mainnet, rpcType: RPCType.Private })

    expect(config?.rpcUrl).toBe('https://private.example')
    expect(config?.isUniRpc).toBeUndefined()
  })
})
