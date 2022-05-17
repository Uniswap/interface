import { Linking } from 'react-native'
import { ChainId, CHAIN_INFO } from 'src/constants/chains'
import { logger } from 'src/utils/logger'

export async function openUri(uri: string) {
  const supported = await Linking.canOpenURL(uri)
  if (!supported) {
    logger.debug('utils/linking', 'openUri', 'cannot open URI', uri)
    return
  }

  try {
    logger.debug('utils/linking', 'openUri', 'attempting to open URI', uri)
    await Linking.openURL(uri)
  } catch (error) {
    logger.error('utils/linking', 'openUri', 'error opening URI', error)
  }
}

export function openSettings() {
  Linking.openSettings()
}

export enum ExplorerDataType {
  TRANSACTION = 'transaction',
  TOKEN = 'token',
  ADDRESS = 'address',
  BLOCK = 'block',
}

/**
 * Return the explorer link for the given data and data type
 * @param chainId the ID of the chain for which to return the data
 * @param data the data to return a link for
 * @param type the type of the data
 */
export function getExplorerLink(chainId: number, data: string, type: ExplorerDataType): string {
  if (chainId === ChainId.ArbitrumOne) {
    switch (type) {
      case ExplorerDataType.TRANSACTION:
        return `https://arbiscan.io/tx/${data}`
      case ExplorerDataType.ADDRESS:
      case ExplorerDataType.TOKEN:
        return `https://arbiscan.io/address/${data}`
      case ExplorerDataType.BLOCK:
        return `https://arbiscan.io/block/${data}`
      default:
        return 'https://arbiscan.io/'
    }
  }

  if (chainId === ChainId.ArbitrumRinkeby) {
    switch (type) {
      case ExplorerDataType.TRANSACTION:
        return `https://rinkeby-explorer.arbitrum.io/tx/${data}`
      case ExplorerDataType.ADDRESS:
      case ExplorerDataType.TOKEN:
        return `https://rinkeby-explorer.arbitrum.io/address/${data}`
      case ExplorerDataType.BLOCK:
        return `https://rinkeby-explorer.arbitrum.io/block/${data}`
      default:
        return 'https://rinkeby-explorer.arbitrum.io/'
    }
  }

  const prefix = CHAIN_INFO[chainId]?.explorer ?? 'https://etherscan.io/'

  switch (type) {
    case ExplorerDataType.TRANSACTION:
      return `${prefix}tx/${data}`

    case ExplorerDataType.TOKEN:
      return `${prefix}token/${data}`

    case ExplorerDataType.BLOCK:
      if (chainId === ChainId.Optimism || chainId === ChainId.OptimisticKovan) {
        return `${prefix}tx/${data}`
      }
      return `${prefix}block/${data}`

    case ExplorerDataType.ADDRESS:
      return `${prefix}address/${data}`
    default:
      return `${prefix}`
  }
}
