import { providers as ethersProviders } from 'ethers'
import { RPCType, UniverseChainId } from 'uniswap/src/features/chains/types'
import type { CreateEthersProvider } from 'uniswap/src/features/providers/createEthersProvider'
import type { RpcConfigResolver } from 'uniswap/src/features/providers/resolveRpcConfig'
import type { Mock } from 'vitest'
import { ProviderManager } from 'wallet/src/features/providers/ProviderManager'

const CHAIN_ID = UniverseChainId.Mainnet
const LEGACY_URL = 'https://name.quiknode.pro/token'
const UNIRPC_URL = 'https://gateway.uniswap.org/rpc/1'

function setup(resolveUrl: () => string | undefined): {
  manager: ProviderManager
  factory: Mock
} {
  // Each call returns a fresh identity so we can assert rebuild vs reuse.
  const factory = vi.fn(() => ({ id: Symbol('provider') }) as unknown as ethersProviders.JsonRpcProvider)
  const resolve = vi.fn((input: { rpcType: RPCType }) =>
    input.rpcType === RPCType.Public ? { rpcUrl: resolveUrl() } : null,
  )
  const manager = new ProviderManager(
    factory as unknown as CreateEthersProvider,
    resolve as unknown as RpcConfigResolver,
  )
  return { manager, factory }
}

describe('ProviderManager', () => {
  it('rebuilds the provider when the resolved RPC URL changes (UniRPC gate flips on after boot)', () => {
    // Boot: Statsig not ready, gate reads false, route resolves to the legacy URL.
    let url: string = LEGACY_URL
    const { manager, factory } = setup(() => url)

    const first = manager.getProvider(CHAIN_ID)
    expect(factory).toHaveBeenCalledTimes(1)

    // Gate flips on mid-session; the route now resolves to UniRPC.
    url = UNIRPC_URL
    const second = manager.getProvider(CHAIN_ID)

    expect(factory).toHaveBeenCalledTimes(2)
    expect(second).not.toBe(first)
  })

  it('reuses the cached provider while the resolved URL is stable', () => {
    const { manager, factory } = setup(() => UNIRPC_URL)

    const a = manager.getProvider(CHAIN_ID)
    const b = manager.getProvider(CHAIN_ID)

    expect(a).toBe(b)
    expect(factory).toHaveBeenCalledTimes(1)
  })
})
