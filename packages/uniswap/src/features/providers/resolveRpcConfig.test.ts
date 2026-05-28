import { RPCType, UniverseChainId } from 'uniswap/src/features/chains/types'
import type { UniRpcConfig } from 'uniswap/src/features/providers/getUniRpcConfig'
import { createRpcConfigResolver } from 'uniswap/src/features/providers/resolveRpcConfig'
import type { RpcConfig } from 'uniswap/src/features/providers/rpcUrlSelector'
import type { Mock } from 'vitest'

const UNIRPC_CONFIG: UniRpcConfig = {
  rpcUrl: 'https://entry-gateway.example.uniswap.org/rpc',
  headers: { 'x-request-source': 'test' },
}

const LEGACY_PUBLIC: RpcConfig = { rpcUrl: 'https://legacy.example.com/public' }
const LEGACY_PRIVATE: RpcConfig = { rpcUrl: 'https://legacy.example.com/private' }

function buildResolver(overrides?: {
  uniRpc?: UniRpcConfig | null
  legacy?: (chainId: UniverseChainId, rpcType: RPCType) => RpcConfig | null
}): {
  resolve: ReturnType<typeof createRpcConfigResolver>
  resolveUniRpcConfig: Mock
  selectLegacyRpcUrl: Mock
} {
  const uniRpcReturn = overrides && 'uniRpc' in overrides ? overrides.uniRpc : UNIRPC_CONFIG
  const resolveUniRpcConfig = vi.fn().mockReturnValue(uniRpcReturn)
  const selectLegacyRpcUrl = vi.fn().mockImplementation((_chainId: UniverseChainId, rpcType: RPCType) => {
    if (overrides?.legacy) {
      return overrides.legacy(_chainId, rpcType)
    }
    return rpcType === RPCType.Private ? LEGACY_PRIVATE : LEGACY_PUBLIC
  })
  const resolve = createRpcConfigResolver({ resolveUniRpcConfig, selectLegacyRpcUrl })
  return { resolve, resolveUniRpcConfig, selectLegacyRpcUrl }
}

describe('createRpcConfigResolver', () => {
  it('falls back to legacy when UniRPC is unavailable (feature flag off or no gateway URL)', () => {
    const { resolve, resolveUniRpcConfig, selectLegacyRpcUrl } = buildResolver({ uniRpc: null })

    const result = resolve({ chainId: UniverseChainId.Mainnet, rpcType: RPCType.Public })

    expect(result).toEqual(LEGACY_PUBLIC)
    expect(resolveUniRpcConfig).toHaveBeenCalledWith({ chainId: UniverseChainId.Mainnet })
    expect(selectLegacyRpcUrl).toHaveBeenCalledWith(UniverseChainId.Mainnet, RPCType.Public)
  })

  it('routes through UniRPC for non-private RPC types when UniRPC is available', () => {
    const { resolve, resolveUniRpcConfig, selectLegacyRpcUrl } = buildResolver()

    const result = resolve({ chainId: UniverseChainId.Mainnet, rpcType: RPCType.Public })

    expect(result).toEqual({
      rpcUrl: UNIRPC_CONFIG.rpcUrl,
      isUniRpc: true,
      headers: UNIRPC_CONFIG.headers,
    })
    expect(resolveUniRpcConfig).toHaveBeenCalledWith({ chainId: UniverseChainId.Mainnet })
    expect(selectLegacyRpcUrl).not.toHaveBeenCalled()
  })

  it('skips UniRPC for RPCType.Private and falls back to legacy', () => {
    const { resolve, resolveUniRpcConfig, selectLegacyRpcUrl } = buildResolver()

    const result = resolve({ chainId: UniverseChainId.Mainnet, rpcType: RPCType.Private })

    expect(result).toEqual(LEGACY_PRIVATE)
    expect(resolveUniRpcConfig).not.toHaveBeenCalled()
    expect(selectLegacyRpcUrl).toHaveBeenCalledWith(UniverseChainId.Mainnet, RPCType.Private)
  })

  it('routes UniRPC for RPCType.PublicAlt (any non-private type)', () => {
    const { resolve, selectLegacyRpcUrl } = buildResolver()

    const result = resolve({ chainId: UniverseChainId.Mainnet, rpcType: RPCType.PublicAlt })

    expect(result).toEqual({
      rpcUrl: UNIRPC_CONFIG.rpcUrl,
      isUniRpc: true,
      headers: UNIRPC_CONFIG.headers,
    })
    expect(selectLegacyRpcUrl).not.toHaveBeenCalled()
  })

  it('flags UniRPC configs with isUniRpc: true; legacy configs do not get the flag', () => {
    const { resolve } = buildResolver()

    const uniRpcResult = resolve({ chainId: UniverseChainId.Mainnet, rpcType: RPCType.Public })
    expect(uniRpcResult?.isUniRpc).toBe(true)

    const legacyResult = resolve({ chainId: UniverseChainId.Mainnet, rpcType: RPCType.Private })
    expect(legacyResult?.isUniRpc).toBeUndefined()
  })

  it('returns null when UniRPC is unavailable and the legacy selector also returns null', () => {
    const { resolve } = buildResolver({
      uniRpc: null,
      legacy: () => null,
    })

    const result = resolve({ chainId: UniverseChainId.Mainnet, rpcType: RPCType.Public })

    expect(result).toBeNull()
  })

  it('passes the chainId through unchanged for both UniRPC and legacy paths', () => {
    const { resolve, resolveUniRpcConfig, selectLegacyRpcUrl } = buildResolver()

    resolve({ chainId: UniverseChainId.ArbitrumOne, rpcType: RPCType.Public })
    expect(resolveUniRpcConfig).toHaveBeenLastCalledWith({ chainId: UniverseChainId.ArbitrumOne })

    resolve({ chainId: UniverseChainId.Optimism, rpcType: RPCType.Private })
    expect(selectLegacyRpcUrl).toHaveBeenLastCalledWith(UniverseChainId.Optimism, RPCType.Private)
  })
})
