import { providers as ethersProviders } from 'ethers'
import { Task } from 'redux-saga'
import { RPCType, WalletChainId } from 'uniswap/src/types/chains'
import { logger } from 'utilities/src/logger/logger'
import { createEthersProvider } from 'wallet/src/features/providers/createEthersProvider'

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

type ChainIdToProvider = Partial<Record<WalletChainId, ProviderInfo>>

export class ProviderManager {
  private readonly _providers: ChainIdToProvider = {}

  private onUpdate: (() => void) | null = null

  setOnUpdate(onUpdate: () => void): void {
    this.onUpdate = onUpdate
  }

  tryGetProvider(chainId: WalletChainId, rpcType: RPCType): ethersProviders.JsonRpcProvider | null {
    try {
      return this.getProvider(chainId, rpcType)
    } catch (error) {
      return null
    }
  }

  getProvider(chainId: WalletChainId, rpcType: RPCType): ethersProviders.JsonRpcProvider {
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

  createProvider(chainId: WalletChainId, rpcType: RPCType = RPCType.Public): undefined {
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

  removeProviders(chainId: WalletChainId): void {
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
