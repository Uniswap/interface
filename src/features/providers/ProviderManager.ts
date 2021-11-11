import { providers as ethersProviders } from 'ethers'
import { Task } from 'redux-saga'
import { config } from 'src/config'
import { ChainId, CHAIN_INFO, L1ChainInfo } from 'src/constants/chains'
import { getEthersProvider } from 'src/features/providers/getEthersProvider'
import { getInfuraChainName } from 'src/features/providers/utils'
import { logger } from 'src/utils/logger'
import { isStale } from 'src/utils/time'
import { promiseTimeout, sleep } from 'src/utils/timing'

enum ProviderStatus {
  Disconnected,
  Initializing,
  Connected,
  Error,
}

interface ProviderDetails {
  provider: ethersProviders.JsonRpcProvider
  status: ProviderStatus
  blockWatcher?: Task
}

export type ChainIdToProvider = Partial<Record<ChainId, ProviderDetails>>

export class ProviderManager {
  private readonly _providers: ChainIdToProvider = {}
  private onUpdate: (() => void) | null = null

  setOnUpdate(onUpdate: () => void) {
    this.onUpdate = onUpdate
  }

  async createProvider(chainId: ChainId) {
    if (this._providers[chainId]) {
      throw new Error(`Attempting to overwrite existing provider for ${chainId}`)
    }
    const chainDetails = CHAIN_INFO[chainId]
    if (!chainDetails) {
      throw new Error(`Cannot create provider for invalid chain details for ${chainId}`)
    }
    // Try all rpcUrls until one works
    const newProvider = await this.initProvider(chainId, chainDetails)
    if (newProvider) {
      this._providers[chainId] = {
        provider: newProvider,
        status: ProviderStatus.Connected,
      }
      this.onUpdate?.()
      return newProvider
    } else {
      // Otherwise show error
      throw new Error(`Failed to create new provider for ${chainId}`)
    }
  }

  removeProvider(chainId: ChainId) {
    if (!this._providers[chainId]) {
      logger.warn(
        'ProviderManager',
        'removeProvider',
        'Attempting to remove non-existing provider',
        chainId
      )
      return
    }
    this._providers[chainId]?.provider.removeAllListeners()
    delete this._providers[chainId]
    this.onUpdate?.()
  }

  hasProvider(chainId: ChainId) {
    return !!this._providers[chainId]
  }

  tryGetProvider(chainId: ChainId) {
    if (!this._providers[chainId]) return null
    const provider = this._providers[chainId]
    if (provider?.status !== ProviderStatus.Connected) return null
    return provider.provider
  }

  getProvider(chainId: ChainId) {
    if (!this._providers[chainId]) {
      throw new Error(`No provider initialized for chain: ${chainId}`)
    }
    const provider = this._providers[chainId]
    if (provider?.status !== ProviderStatus.Connected) {
      throw new Error(`Provider not connected for chain: ${chainId}`)
    }
    return provider.provider
  }

  getAllProviders() {
    return this._providers
  }

  getProviderBlockWatcher(chainId: ChainId) {
    if (!this._providers[chainId]) {
      throw new Error(`No provider initialized for chain: ${chainId}`)
    }
    return this._providers[chainId]?.blockWatcher
  }

  setProviderBlockWatcher(chainId: ChainId, watcher: Task) {
    if (!this._providers[chainId]) {
      throw new Error(`No provider initialized for chain: ${chainId}`)
    }
    this._providers[chainId]!.blockWatcher = watcher
  }

  private async initProvider(chainId: ChainId, chainDetails: L1ChainInfo) {
    try {
      logger.info(
        'ProviderManager',
        'initProvider',
        `Connecting to infura rpc provider for ${getInfuraChainName(chainId)}`
      )
      const provider = getEthersProvider(chainId, config)
      for (let i = 0; i < 3; i++) {
        const blockAndNetworkP = Promise.all([provider.getBlock('latest'), provider.getNetwork()])
        const blockAndNetwork = await promiseTimeout(blockAndNetworkP, 1000)
        if (
          blockAndNetwork &&
          this.isProviderSynced(chainId, chainDetails, blockAndNetwork[0], blockAndNetwork[1])
        ) {
          logger.info('ProviderManager', 'initProvider', 'Provider is connected')
          return provider
        }
        // Otherwise wait a bit and then try again
        await sleep(1000)
      }
      throw new Error('Unable to sync after 3 attempts')
    } catch (error) {
      logger.error(
        'ProviderManager',
        'initProvider',
        `Failed to connect to infura rpc provider for: ${chainId}`,
        error
      )
      return null
    }
  }

  private isProviderSynced(
    chainId: ChainId,
    chainDetails: L1ChainInfo,
    block?: ethersProviders.Block,
    network?: ethersProviders.Network
  ) {
    const staleTime = chainDetails.blockWaitMsBeforeWarning ?? 600000
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
