import { providers as ethersProviders, Signer } from 'ethers'
import { Task } from 'redux-saga'
import { RPCType, UniverseChainId } from 'uniswap/src/features/chains/types'
import type { CreateEthersProvider } from 'uniswap/src/features/providers/createEthersProvider'
import type { RpcConfigResolver } from 'uniswap/src/features/providers/resolveRpcConfig'
import { logger } from 'utilities/src/logger/logger'

enum ProviderStatus {
  Disconnected = 0,
  Connected = 1,
  Error = 2,
}

interface ProviderDetails {
  provider: ethersProviders.JsonRpcProvider
  status: ProviderStatus
  // The resolved RPC URL the cached provider was built with. Used to detect
  // when the route has changed (e.g. the UniRPC gate flipping on after boot)
  // so the cached provider can be rebuilt instead of serving a stale endpoint.
  rpcUrl?: string
  blockWatcher?: Task
}

// A private provider can be authenticated and thus tied to a specific address
interface PrivateProviderDetails extends ProviderDetails {
  address?: Address
}

type ProviderInfo = Partial<{
  public: ProviderDetails
  private: PrivateProviderDetails
}>

type ChainIdToProvider = Partial<Record<UniverseChainId, ProviderInfo>>

export class ProviderManager {
  private readonly _providers: ChainIdToProvider = {}
  private readonly providerFactory: CreateEthersProvider
  private readonly resolveRpcConfig: RpcConfigResolver

  private onUpdate: (() => void) | null = null

  constructor(providerFactory: CreateEthersProvider, resolveRpcConfig: RpcConfigResolver) {
    this.providerFactory = providerFactory
    this.resolveRpcConfig = resolveRpcConfig
  }

  setOnUpdate(onUpdate: () => void): void {
    this.onUpdate = onUpdate
  }

  tryGetProvider(chainId: UniverseChainId): ethersProviders.JsonRpcProvider | null {
    try {
      return this.getProvider(chainId)
    } catch (_error) {
      return null
    }
  }

  getProvider(chainId: UniverseChainId): ethersProviders.JsonRpcProvider {
    const cachedProviderDetails = this._providers[chainId]?.public
    // Re-resolve the route every call and rebuild when it changes. `initProviders`
    // eagerly constructs providers at boot, before Statsig's flag registry is
    // ready — the UniRPC gate reads false and the cache captures the legacy
    // (QuickNode) URL, pinning the chain to it for the whole session even after
    // the gate turns on. ViemClientManager.getViemClient solves the same problem
    // by re-resolving; this is its ethers counterpart, but keyed on the URL so a
    // new provider is built only when the endpoint actually changes (ethers
    // provider construction is heavier than viem's), not on every call.
    const targetRpcUrl = this.resolveRpcConfig({ chainId, rpcType: RPCType.Public })?.rpcUrl
    if (
      !cachedProviderDetails ||
      cachedProviderDetails.status !== ProviderStatus.Connected ||
      cachedProviderDetails.rpcUrl !== targetRpcUrl
    ) {
      this.createProvider(chainId)
    }

    const providerDetails = this._providers[chainId]?.public

    if (providerDetails?.status !== ProviderStatus.Connected) {
      throw new Error(`Public provider not connected for chain: ${chainId}`)
    }

    return providerDetails.provider
  }

  async getPrivateProvider(chainId: UniverseChainId, signer?: Signer): Promise<ethersProviders.JsonRpcProvider> {
    const signerAddress = await signer?.getAddress()
    const cachedProviderDetails = this._providers[chainId]?.private
    if (
      !cachedProviderDetails ||
      cachedProviderDetails.address !== signerAddress ||
      cachedProviderDetails.status !== ProviderStatus.Connected
    ) {
      this.buildPrivateProvider({ chainId, signer, address: signerAddress })
    }

    const providerDetails = this._providers[chainId]?.private
    if (providerDetails?.status !== ProviderStatus.Connected || providerDetails.address !== signerAddress) {
      throw new Error(`Private provider not connected for chain ${chainId}, address ${signerAddress}`)
    }

    return providerDetails.provider
  }

  createProvider(chainId: UniverseChainId): undefined {
    const provider = this.providerFactory({ chainId, rpcType: RPCType.Public })
    if (!provider) {
      return
    }

    const rpcUrl = this.resolveRpcConfig({ chainId, rpcType: RPCType.Public })?.rpcUrl
    this._providers[chainId] = {
      ...this._providers[chainId],
      public: { provider, status: ProviderStatus.Connected, rpcUrl },
    }
    this.onUpdate?.()
  }

  private buildPrivateProvider({
    chainId,
    signer,
    address,
  }: {
    chainId: UniverseChainId
    signer?: Signer
    address?: Address
  }): undefined {
    const provider = this.providerFactory({
      chainId,
      rpcType: RPCType.Private,
      signerInfo: signer && address ? { signer, address } : undefined,
    })
    if (!provider) {
      return
    }

    this._providers[chainId] = {
      ...this._providers[chainId],
      private: { provider, status: ProviderStatus.Connected, address },
    }
    this.onUpdate?.()
  }

  removeProviders(chainId: UniverseChainId): void {
    const providersInfo = this._providers[chainId]
    if (!providersInfo) {
      logger.warn('ProviderManager', 'removeProviders', `Attempting to remove non-existent provider: ${chainId}`)
      return
    }

    Object.values(providersInfo).forEach((providerInfo) => {
      providerInfo.provider.removeAllListeners()
    })

    delete this._providers[chainId]
    this.onUpdate?.()
  }
}
