import { getChainInfoOrDefault } from '../constants/chainInfo'
import { SupportedChainId } from '../constants/chains'

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
  const { explorer } = getChainInfoOrDefault(chainId ? chainId : SupportedChainId.MAINNET)

  switch (type) {
    case ExplorerDataType.TRANSACTION:
      return `${explorer}tx/${data}`

    case ExplorerDataType.TOKEN:
      return `${explorer}token/${data}`

    case ExplorerDataType.BLOCK:
      return `${explorer}block/${data}`

    case ExplorerDataType.ADDRESS:
      return `${explorer}address/${data}`
    default:
      return `${explorer}`
  }
}
