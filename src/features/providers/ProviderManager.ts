/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Mutex } from 'async-mutex'
import { providers as ethersProviders } from 'ethers'
import { Task } from 'redux-saga'
import { config } from 'src/config'
import { ChainId, CHAIN_INFO } from 'src/constants/chains'
import { FLASHBOTS_URLS } from 'src/features/providers/constants'
import { FLASHBOTS_SUPPORTED_CHAINS } from 'src/features/providers/flashbotsProvider'
import { getEthersProvider } from 'src/features/providers/getEthersProvider'
import { getInfuraChainName } from 'src/features/providers/utils'
import { logMessage } from 'src/features/telemetry'
import { LogContext } from 'src/features/telemetry/constants'
import { logger } from 'src/utils/logger'
import { isStale } from 'src/utils/time'
import { promiseTimeout, sleep } from 'src/utils/timing'

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

export type ChainIdToProvider = Partial<Record<ChainId, ProviderDetails>>
export type ChainIdToMutex = Partial<Record<ChainId, Mutex>>

const LOG_CONTEXT = LogContext.ProviderManager

const getChainDetails = (chainId: ChainId) => {
  const chainDetails = CHAIN_INFO[chainId]
  if (!chainDetails) {
    const error = new Error(`Cannot create provider for invalid chain details for ${chainId}`)
    logger.error('ProviderManager', 'getChainDetails', `${error}`)
    throw error
  }
  return chainDetails
}

const insertMutex = new Mutex()

export class ProviderManager {
  private readonly _providers: ChainIdToProvider = {}
  private readonly _mutex: ChainIdToMutex = {}
  private onUpdate: (() => void) | null = null

  setOnUpdate(onUpdate: () => void) {
    this.onUpdate = onUpdate
  }

  async createProvider(chainId: ChainId): Promise<ethersProviders.Provider> {
    if (!this._mutex[chainId]) {
      await insertMutex.runExclusive(() => {
        this._mutex[chainId] = new Mutex()
      })
    }

    const mutex = this._mutex[chainId]!
    const provider: ethersProviders.Provider = await mutex.runExclusive(async () => {
      const cachedProvider = this._providers[chainId]
      if (cachedProvider) {
        return cachedProvider.provider
      }
      // Try all rpcUrls until one works
      const newProvider = await this.initProvider(chainId)
      if (newProvider) {
        this._providers[chainId] = {
          provider: newProvider,
          status: ProviderStatus.Connected,
        }
        this.onUpdate?.()
        return newProvider
      } else {
        const error = new Error(`Failed to create new provider for ${chainId}`)
        logger.error('ProviderManager', 'createProvider', `${error}`)
        // Otherwise show error
        throw error
      }
    })
    return provider
  }

  private getFlashbotsProvider(chainId: ChainId) {
    if (!FLASHBOTS_SUPPORTED_CHAINS.includes(chainId.toString())) {
      throw new Error(`${chainId} is not supported by flashbots`)
    }

    const flashbotsUrl = FLASHBOTS_URLS[chainId]?.rpcUrl
    return new ethersProviders.JsonRpcProvider(flashbotsUrl)
  }

  removeProvider(chainId: ChainId) {
    if (!this._providers[chainId]) {
      logMessage(LOG_CONTEXT, `Attempting to remove non-existing provider: ${chainId}`)
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

  getProvider(chainId: ChainId, isFlashbots?: boolean): ethersProviders.JsonRpcProvider {
    if (isFlashbots) return this.getFlashbotsProvider(chainId)

    if (!this._providers[chainId]) {
      throw new Error(`No provider initialized for chain: ${chainId}`)
    }
    const provider = this._providers[chainId]
    if (provider?.status !== ProviderStatus.Connected) {
      throw new Error(`Provider not connected for chain: ${chainId}`)
    }
    return provider.provider
  }

  // TODO: [MOB-3895] responsibility of this overlaps with init code in providerSaga which is initializing all upfront
  // Switch to using lazy init throughout app or cut this
  async getInitalizedProvider(chainId: ChainId): Promise<ethersProviders.Provider> {
    if (this.hasProvider(chainId)) {
      return this._providers[chainId]!.provider
    } else {
      return this.createProvider(chainId)
    }
  }

  getAllProviders() {
    return this._providers
  }

  private async initProvider(chainId: ChainId) {
    try {
      logger.info(
        LOG_CONTEXT,
        'initProvider',
        `Connecting to infura rpc provider for ${getInfuraChainName(chainId)}`
      )
      const provider = getEthersProvider(chainId, config)
      for (let i = 0; i < 3; i++) {
        const blockAndNetworkP = Promise.all([provider.getBlock('latest'), provider.getNetwork()])
        const blockAndNetwork = await promiseTimeout(blockAndNetworkP, 1000)

        if (
          blockAndNetwork &&
          this.isProviderSynced(chainId, blockAndNetwork[0], blockAndNetwork[1])
        ) {
          logger.info(
            LOG_CONTEXT,
            'initProvider',
            `${getInfuraChainName(chainId)} Provider is connected`
          )
          return provider
        }
        // Otherwise wait a bit and then try again
        await sleep(1000)
      }
      throw new Error(`Unable to sync ${getInfuraChainName(chainId)} after 3 attempts`)
    } catch (error) {
      logger.error(
        'ProviderManager',
        'initProvider',
        `Failed to connect to infura rpc provider for: ${getInfuraChainName(chainId)}`,
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
    const chainDetails = getChainDetails(chainId)
    const staleTime = chainDetails.blockWaitMsBeforeWarning ?? 600_000 // 10 minutes
    if (!(block && block.number && block.timestamp && network && network.chainId === chainId)) {
      return false
    }
    if (isStale(block.timestamp * 1000, staleTime)) {
      logger.debug(
        LOG_CONTEXT,
        'isProviderSynced',
        `Provider ${getInfuraChainName(chainId)} is stale`
      )
      return false
    }
    return true
  }
}
