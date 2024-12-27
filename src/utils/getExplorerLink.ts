import { ChainId } from '@uniswap/sdk-core'

const CHAIN_ID_TO_PREFIX: { [chainId in ChainId]: string } = {
  1: 'https://etherscan.io',
  3: 'https://ropsten.etherscan.io',
  4: 'https://rinkeby.etherscan.io',
  5: 'https://goerli.etherscan.io',
  42: 'https://kovan.etherscan.io',
  80002: 'https://amoy.polygonscan.com',
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
export function getExplorerLink(chainId: ChainId, data: string, type: ExplorerDataType): string {
  switch (type) {
    case ExplorerDataType.TRANSACTION:
      return `${CHAIN_ID_TO_PREFIX[chainId]}/tx/${data}`
    case ExplorerDataType.TOKEN:
      return `${CHAIN_ID_TO_PREFIX[chainId]}/token/${data}`
    case ExplorerDataType.BLOCK:
      return `${CHAIN_ID_TO_PREFIX[chainId]}/block/${data}`
    default:
      return `${CHAIN_ID_TO_PREFIX[chainId]}/address/${data}`
  }
}
