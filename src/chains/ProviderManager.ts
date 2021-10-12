import { providers as ethersProviders } from 'ethers'
import { CHAIN_INFO, L1ChainInfo, SupportedChainId } from 'src/constants/chains'
import { logger } from 'src/utils/logger'
import { isStale } from 'src/utils/time'
import { promiseTimeout, sleep } from 'src/utils/timeout'

// Temporary project id
// TODO move to config file
const PROJECT_ID = 'c210a3529cad40d3b42310838a7baa47'

enum ProviderStatus {
  Disconnected,
  Initializing,
  Connected,
  Error,
}

interface ProviderDetails {
  provider: ethersProviders.JsonRpcProvider
  status: ProviderStatus
}

export class ProviderManager {
  private readonly _providers: Partial<Record<SupportedChainId, ProviderDetails>> = {}

  async createProvider(chainId: SupportedChainId) {
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
      return newProvider
    } else {
      // Otherwise show error
      throw new Error(`Failed to create new provider for ${chainId}`)
    }
  }

  removeProvider(chainId: SupportedChainId) {
    if (!this._providers[chainId]) {
      logger.warn('Attempting to remove non-existing provider', chainId)
      return
    }
    delete this._providers[chainId]
  }

  getProvider(chainId: SupportedChainId) {
    if (!this._providers[chainId]) {
      throw new Error(`No provider initialized for chain: ${chainId}`)
    }
    const provider = this._providers[chainId]
    if (provider?.status !== ProviderStatus.Connected) {
      throw new Error(`Provider not connected for chain: ${chainId}`)
    }
    return provider.provider
  }

  private async initProvider(chainId: SupportedChainId, chainDetails: L1ChainInfo) {
    try {
      const chainName = this.getInfuraChainName(chainId)
      logger.info(`Connecting to infura rpc provider for ${chainName}`)
      const provider = new ethersProviders.InfuraProvider(chainName, PROJECT_ID)
      for (let i = 0; i < 3; i++) {
        const blockAndNetworkP = Promise.all([provider.getBlock('latest'), provider.getNetwork()])
        const blockAndNetwork = await promiseTimeout(blockAndNetworkP, 1000)
        if (
          blockAndNetwork &&
          this.isProviderSynced(chainId, chainDetails, blockAndNetwork[0], blockAndNetwork[1])
        ) {
          logger.info('Provider is connected')
          return provider
        }
        // Otherwise wait a bit and then try again
        await sleep(1000)
      }
      throw new Error('Unable to sync after 3 attempts')
    } catch (error) {
      logger.error(`Failed to connect to infura rpc provider for: ${chainId}`, error)
      return null
    }
  }

  private isProviderSynced(
    chainId: SupportedChainId,
    chainDetails: L1ChainInfo,
    block?: ethersProviders.Block,
    network?: ethersProviders.Network
  ) {
    const staleTime = chainDetails.blockWaitMsBeforeWarning ?? 600000
    return (
      block &&
      block.number &&
      block.timestamp &&
      !isStale(block.timestamp * 1000, staleTime) &&
      network &&
      network.chainId === chainId
    )
  }

  private getInfuraChainName(chainId: SupportedChainId) {
    switch (chainId) {
      case SupportedChainId.MAINNET:
        return 'homestead'
      case SupportedChainId.RINKEBY:
        return 'rinkeby'
      case SupportedChainId.ROPSTEN:
        return 'ropsten'
      case SupportedChainId.GOERLI:
        return 'goerli'
      case SupportedChainId.KOVAN:
        return 'kovan'
      default:
        throw new Error(`Unsupported eth infura chainId for ${chainId}`)
    }
  }
}
