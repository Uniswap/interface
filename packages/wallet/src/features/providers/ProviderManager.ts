import { providers as ethersProviders } from 'ethers'
import { Task } from 'redux-saga'
import { serializeError } from 'utilities/src/errors'
import { logger } from 'utilities/src/logger/logger'
import { isStale } from 'utilities/src/time/time'
import { config } from 'wallet/src/config'
import {
  AlternativeRpcType,
  ALT_RPC_URLS_BY_CHAIN,
  ChainId,
  CHAIN_INFO,
  L1ChainInfo,
  L2ChainInfo,
} from 'wallet/src/constants/chains'

import {
  getEthersProvider,
  getEthersProviderFromRpcUrl,
} from 'wallet/src/features/providers/getEthersProvider'
import { getInfuraChainName } from 'wallet/src/features/providers/utils'

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
    logger.error('Cannot create provider for invalid chain details', {
      tags: {
        file: 'ProviderManager',
        function: 'getChainDetails',
        chainDetails,
      },
    })
    throw new Error(`Cannot create provider for invalid chain details for ${chainId}`)
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

    logger.error('Failed to create provider', {
      tags: {
        file: 'ProviderManager',
        function: 'createProvider',
        chainId,
      },
    })
    // Otherwise show error
    throw new Error(`Failed to create new provider for ${chainId}`)
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

  getProvider(
    chainId: ChainId,
    alternativeRpcType?: AlternativeRpcType
  ): ethersProviders.JsonRpcProvider {
    if (alternativeRpcType) {
      return this.getAlternativeRpcProvider(chainId, alternativeRpcType)
    }
    if (!this._providers[chainId]) {
      throw new Error(`No provider initialized for chain: ${chainId}`)
    }
    const provider = this._providers[chainId]
    if (provider?.status !== ProviderStatus.Connected) {
      throw new Error(`Provider not connected for chain: ${chainId}`)
    }
    return provider.provider
  }

  // TODO: [MOB-562] responsibility of this overlaps with init code in providerSaga which is initializing all upfront
  // Switch to using lazy init throughout app or cut this
  getInitializedProvider(chainId: ChainId): ethersProviders.Provider {
    if (this.hasProvider(chainId)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return this._providers[chainId]!.provider
    }
    return this.createProvider(chainId)
  }

  getAllProviders(): Partial<Record<ChainId, ProviderDetails>> {
    return this._providers
  }

  private initProvider(chainId: ChainId): Nullable<ethersProviders.JsonRpcProvider> {
    try {
      // Attempt to create provider using getEthersProvider for Infura supported chains
      const infuraChainName = getInfuraChainName(chainId)

      logger.debug(
        'ProviderManager',
        'initProvider',
        `Connecting to infura rpc provider for ${infuraChainName}`
      )

      const provider = getEthersProvider(chainId, config)
      return provider
    } catch (error) {
      // Attempt to fallback creating provider from RPC urls defined by CHAIN_INFO
      try {
        logger.debug(
          'ProviderManager',
          'initProvider',
          `Fallback connecting to infura rpc provider for ${chainId}`
        )
        const provider = getEthersProviderFromRpcUrl(chainId)
        return provider
      } catch (e) {
        logger.error('Failed to initialize provider', {
          tags: {
            file: 'ProviderManager',
            function: 'initProvider',
            chainId,
            error: serializeError(e),
          },
        })
        return null
      }
    }
  }

  private getAlternativeRpcProvider(
    chainId: ChainId,
    alternativeRpcType: AlternativeRpcType
  ): ethersProviders.JsonRpcProvider {
    const rpcUrl = ALT_RPC_URLS_BY_CHAIN[chainId]?.[alternativeRpcType]
    if (!rpcUrl) throw new Error(`${chainId} is not supported by rpc type: ${alternativeRpcType}`)
    return new ethersProviders.JsonRpcProvider(rpcUrl)
  }

  private isProviderSynced(
    chainId: ChainId,
    block?: ethersProviders.Block,
    network?: ethersProviders.Network
  ): boolean {
    const chainDetails = getChainDetails(chainId)
    const staleTime = chainDetails.blockWaitMsBeforeWarning ?? 600_000 // 10 minutes
    if (!(block && block.number && block.timestamp && network && network.chainId === chainId)) {
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
