import { providers as ethersProviders } from 'ethers'
import { Task } from 'redux-saga'
import { logger } from 'utilities/src/logger/logger'
import { isStale } from 'utilities/src/time/time'
import { CHAIN_INFO, ChainId, L1ChainInfo, L2ChainInfo, RPCType } from 'wallet/src/constants/chains'
import { createEthersProvider } from 'wallet/src/features/providers/createEthersProvider'
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

type ProviderInfo = Partial<{
  [key in keyof RPCType as RPCType]: ProviderDetails
}>

type ChainIdToProvider = Partial<Record<ChainId, ProviderInfo>>

const getChainDetails = (chainId: ChainId): L1ChainInfo | L2ChainInfo => {
  const chainDetails = CHAIN_INFO[chainId]
  if (!chainDetails) {
    logger.error(new Error('Cannot create provider for invalid chain details'), {
      tags: {
        file: 'ProviderManager',
        function: 'getChainDetails',
      },
      extra: { chainDetails },
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

  tryGetProvider(chainId: ChainId, rpcType: RPCType): ethersProviders.JsonRpcProvider | null {
    try {
      return this.getProvider(chainId, rpcType)
    } catch (error) {
      return null
    }
  }

  getProvider(chainId: ChainId, rpcType: RPCType): ethersProviders.JsonRpcProvider {
    const cachedProviderDetails = this._providers[chainId]?.[rpcType]
    if (cachedProviderDetails?.status === ProviderStatus.Connected) {
      return cachedProviderDetails.provider
    }

    this.createProvider(chainId, rpcType)
    const providerDetails = this._providers[chainId]?.[rpcType]

    if (providerDetails?.status !== ProviderStatus.Connected) {
      throw new Error(`Provider of type ${rpcType} not connected for chain: ${chainId}`)
    }

    return providerDetails.provider
  }

  createProvider(chainId: ChainId, rpcType: RPCType = RPCType.Public): undefined {
    const provider = createEthersProvider(chainId, rpcType)
    if (!provider) {
      if (rpcType === RPCType.Public) {
        // TODO: pop a toast one time to let the user know and maybe update a status page
      }
      return
    }

    this._providers[chainId] = {
      ...this._providers[chainId],
      [rpcType]: { provider, status: ProviderStatus.Connected },
    }
    this.onUpdate?.()
  }

  removeProviders(chainId: ChainId): void {
    const providersInfo = this._providers[chainId]
    if (!providersInfo) {
      logger.warn(
        'ProviderManager',
        'removeProviders',
        `Attempting to remove non-existent provider: ${chainId}`
      )
      return
    }

    Object.values(providersInfo).forEach((providerInfo) => {
      providerInfo.provider.removeAllListeners()
    })

    delete this._providers[chainId]
    this.onUpdate?.()
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
