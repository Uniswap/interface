import { Signer } from 'ethers'
import { PublicClient } from 'viem'
import type { CreateViemClient } from './createViemClient'
import { RPCType, UniverseChainId } from './types'

type ViemClientInfo = Partial<{
  public?: PublicClient
  private?: PublicClient
}>

type ChainIdToViemClient = Partial<Record<UniverseChainId, ViemClientInfo>>

export class ViemClientManager {
  private readonly _viemClients: ChainIdToViemClient = {}
  private readonly createClient: CreateViemClient

  private onUpdate: (() => void) | null = null

  constructor(createClient: CreateViemClient) {
    this.createClient = createClient
  }

  setOnUpdate(onUpdate: () => void): void {
    this.onUpdate = onUpdate
  }

  createViemClient(chainId: UniverseChainId): undefined {
    const client = this.createClient({ chainId, rpcType: RPCType.Public })
    if (!client) {
      return
    }

    this._viemClients[chainId] = {
      ...this._viemClients[chainId],
      public: client,
    }
    this.onUpdate?.()
  }

  createPrivateViemClient({
    chainId,
    signer,
    address,
  }: {
    chainId: UniverseChainId
    signer?: Signer
    address?: string
  }): undefined {
    const signerInfo = signer && address ? { signer, address } : undefined
    const client = this.createClient({ chainId, rpcType: RPCType.Private, signerInfo })
    if (!client) {
      return
    }

    this._viemClients[chainId] = {
      ...this._viemClients[chainId],
      private: client,
    }
    this.onUpdate?.()
  }

  getViemClient(chainId: UniverseChainId): PublicClient {
    // Re-resolve on every call so the manager tracks the current rpc config
    // instead of returning whatever the factory produced at startup. Two
    // boot-time conditions used to silently pin the chain to a legacy URL
    // for the whole session:
    //   1. The `initProviders` saga eagerly constructs clients for every EVM
    //      chain before Statsig's flag registry has finished initializing —
    //      `isStatsigClientRegistered()` returns false, the UniRPC gate read
    //      short-circuits to false, and the cache captures the legacy URL.
    //   2. The user toggling `unirpc_enabled` via the FeatureFlagModal after
    //      app start — the cache still held the URL resolved at boot.
    // Re-resolving here is cheap (synchronous flag check + viem client
    // construction is sub-millisecond) and fixes both paths in one place.
    const client = this.createClient({ chainId, rpcType: RPCType.Public })
    if (!client) {
      throw new Error(`Viem client doesn't exist for chain ${chainId}`)
    }
    return client
  }

  async getPrivateViemClient(chainId: UniverseChainId, signer?: Signer): Promise<PublicClient> {
    const signerAddress = await signer?.getAddress()
    const signerInfo = signer && signerAddress ? { signer, address: signerAddress } : undefined
    // See `getViemClient` for the rationale on re-resolving every call. The
    // private path has an additional staleness vector: a cached client tied
    // to one signer would survive an account switch. Re-resolving handles
    // both the rpc-config and the signer-identity cases.
    const client = this.createClient({ chainId, rpcType: RPCType.Private, signerInfo })
    if (!client) {
      throw new Error(`Viem client doesn't exist for chain ${chainId}`)
    }
    return client
  }
}
