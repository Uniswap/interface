import { providers as ethersProviders } from 'ethers'
import { Task } from 'redux-saga'
import { CHAIN_INFO, ChainId, L1ChainInfo, L2ChainInfo } from '../chains/chains'
import { logger } from '../logger/logger'

import { getInfuraChainName } from './utils'

enum ProviderStatus {
  Disconnected,
  Connected,
  Error,
}

interface ProviderDetails {
  provider: ethersProviders.JsonRpcProvider
  status: ProviderStatus
  blockWatcher?: Task
}

type ChainIdToProvider = Partial<Record<ChainId, ProviderDetails>>

const getChainDetails = (chainId: ChainId): L1ChainInfo | L2ChainInfo => {
  const chainDetails = CHAIN_INFO[chainId]
  if (!chainDetails) {
    const error = new Error(
      `Cannot create provider for invalid chain details for ${chainId}`
    )
    logger.error('ProviderManager', 'getChainDetails', `${error}`)
    throw error
  }
  return chainDetails
}

export class ProviderManager {
  private readonly _providers: ChainIdToProvider = {}

  private onUpdate: (() => void) | null = null

  setOnUpdate(onUpdate: () => void): void {
    this.onUpdate = onUpdate
  }

  createProvider(chainId: ChainId): ethersProviders.Provider {
    const cachedProvider = this._providers[chainId]
    if (cachedProvider) {
      return cachedProvider.provider
    }

    const newProvider = this.initProvider(chainId)
    if (newProvider) {
      this._providers[chainId] = {
        provider: newProvider,
        status: ProviderStatus.Connected,
      }
      this.onUpdate?.()
      return newProvider
    }
    const error = new Error(`Failed to create new provider for ${chainId}`)
    logger.error('ProviderManager', 'createProvider', `${error}`)
    // Otherwise show error
    throw error
  }

  removeProvider(chainId: ChainId): void {
    if (!this._providers[chainId]) {
      logger.warn(
        'ProviderManager',
        'removeProvider',
        `Attempting to remove non-existent provider: ${chainId}`
      )
      return
    }
    this._providers[chainId]?.provider.removeAllListeners()
    delete this._providers[chainId]
    this.onUpdate?.()
  }

  hasProvider(chainId: ChainId): boolean {
    return !!this._providers[chainId]
  }

  tryGetProvider(chainId: ChainId): ethersProviders.JsonRpcProvider | null {
    if (!this._providers[chainId]) return null
    const provider = this._providers[chainId]
    if (provider?.status !== ProviderStatus.Connected) return null
    return provider.provider
  }

  getProvider(chainId: ChainId): ethersProviders.JsonRpcProvider {
    if (!this._providers[chainId]) {
      throw new Error(`No provider initialized for chain: ${chainId}`)
    }
    const provider = this._providers[chainId]
    if (provider?.status !== ProviderStatus.Connected) {
      throw new Error(`Provider not connected for chain: ${chainId}`)
    }
    return provider.provider
  }

  getInitalizedProvider(chainId: ChainId): ethersProviders.Provider {
    if (this.hasProvider(chainId)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return this._providers[chainId]!.provider
    }
    return this.createProvider(chainId)
  }

  getAllProviders(): Partial<Record<ChainId, ProviderDetails>> {
    return this._providers
  }

  private initProvider(
    chainId: ChainId
  ): Nullable<ethersProviders.JsonRpcProvider> {
    try {
      logger.debug(
        'ProviderManager',
        'initProvider',
        `Connecting to infura rpc provider for ${getInfuraChainName(chainId)}`
      )

      const provider = new ethersProviders.InfuraProvider(
        getInfuraChainName(chainId),
        'b14063d3418c40ec984f510cf64083b4'
      )

      return provider
    } catch (error) {
      logger.error(
        'ProviderManager',
        'initProvider',
        `Failed to connect to infura rpc provider for: ${getInfuraChainName(
          chainId
        )}`,
        error
      )
      return null
    }
  }

  private isProviderSynced(
    chainId: ChainId,
    block?: ethersProviders.Block,
    network?: ethersProviders.Network
  ): boolean {
    function isStale(lastUpdated: number | null, staleTime: number): boolean {
      return !lastUpdated || Date.now() - lastUpdated > staleTime
    }

    const chainDetails = getChainDetails(chainId)
    const staleTime = chainDetails.blockWaitMsBeforeWarning ?? 600_000 // 10 minutes
    if (
      !(
        block &&
        block.number &&
        block.timestamp &&
        network &&
        network.chainId === chainId
      )
    ) {
      return false
    }
    if (isStale(block.timestamp * 1000, staleTime)) {
      logger.debug(
        'ProviderManager',
        'isProviderSynced',
        `Provider ${getInfuraChainName(chainId)} is stale`
      )
      return false
    }
    return true
  }
}
