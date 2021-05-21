import { SupportedChainId } from '../constants/misc'

const ETHERSCAN_PREFIXES: { [chainId: number]: string } = {
  [SupportedChainId.MAINNET]: '',
  [SupportedChainId.ROPSTEN]: 'ropsten.',
  [SupportedChainId.RINKEBY]: 'rinkeby.',
  [SupportedChainId.GOERLI]: 'goerli.',
  [SupportedChainId.KOVAN]: 'kovan.',
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
  if (chainId in ETHERSCAN_PREFIXES) {
    const prefix = `https://${ETHERSCAN_PREFIXES[chainId] ?? ''}etherscan.io`

    switch (type) {
      case ExplorerDataType.TRANSACTION: {
        return `${prefix}/tx/${data}`
      }
      case ExplorerDataType.TOKEN: {
        return `${prefix}/token/${data}`
      }
      case ExplorerDataType.BLOCK: {
        return `${prefix}/block/${data}`
      }
      case ExplorerDataType.ADDRESS:
      default: {
        return `${prefix}/address/${data}`
      }
    }
  } else {
    switch (type) {
      case ExplorerDataType.TRANSACTION:
        return `https://explorer5.arbitrum.io/#/tx/${data}`
      case ExplorerDataType.ADDRESS:
        return `https://explorer5.arbitrum.io/#/address/${data}`
      default:
        return `https://explorer5.arbitrum.io`
    }
  }
}
