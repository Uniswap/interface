import { ChainId } from 'constants/chains'

const EXPLORER_PREFIXES: { [chainId in ChainId]: string } = {
  [ChainId.MAINNET]: 'evm.evmos.org',
  [ChainId.TESTNET]: 'evm.evmos.dev',
  [ChainId.RINKEBY]: 'rinkeby.etherscan.io',
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
  const prefix = `https://${EXPLORER_PREFIXES[chainId] || EXPLORER_PREFIXES[ChainId.MAINNET]}`

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
}
