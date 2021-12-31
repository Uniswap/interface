import { SupportedChainId } from '../constants/chains'

const ETHERSCAN_PREFIXES: { [chainId: number]: string } = {
  [SupportedChainId.MAINNET]: 'explorer.xinfin.',
  [SupportedChainId.TESTNET]: 'explorer.apothem.',
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
  const prefix = `https://${ETHERSCAN_PREFIXES[chainId] ?? ''}network`

  switch (type) {
    case ExplorerDataType.TRANSACTION:
      return `${prefix}/txs/${data}`

    case ExplorerDataType.TOKEN:
      return `${prefix}/tokens/${data}`

    case ExplorerDataType.BLOCK:
      return `${prefix}/blocks/${data}`

    case ExplorerDataType.ADDRESS:
      return `${prefix}/address/${data}`
    default:
      return `${prefix}`
  }
}
