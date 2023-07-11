import { ChainId } from '@thinkincoin-libs/sdk-core'

const BLOCK_EXPLORER_PREFIXES: { [chainId: number]: string } = {
  [ChainId.MAINNET]: 'https://etherscan.io',
  [ChainId.GOERLI]: 'https://goerli.etherscan.io',
  [ChainId.SEPOLIA]: 'https://sepolia.etherscan.io',
  [ChainId.OPTIMISM]: 'https://optimistic.etherscan.io',
  [ChainId.OPTIMISM_GOERLI]: 'https://goerli-optimism.etherscan.io',
  [ChainId.POLYGON]: 'https://polygonscan.com',
  [ChainId.POLYGON_MUMBAI]: 'https://mumbai.polygonscan.com',
  [ChainId.CELO]: 'https://celoscan.io',
  [ChainId.CELO_ALFAJORES]: 'https://alfajores-blockscout.celo-testnet.org',
  [ChainId.BNB]: 'https://bscscan.com',
  [ChainId.AVALANCHE]: 'https://snowtrace.io',
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
  if (chainId === ChainId.ARBITRUM_ONE) {
    switch (type) {
      case ExplorerDataType.TRANSACTION:
        return `https://arbiscan.io/tx/${data}`
      case ExplorerDataType.ADDRESS:
      case ExplorerDataType.TOKEN:
        return `https://arbiscan.io/address/${data}`
      case ExplorerDataType.BLOCK:
        return `https://arbiscan.io/block/${data}`
      default:
        return `https://arbiscan.io/`
    }
  }

  if (chainId === ChainId.ARBITRUM_GOERLI) {
    switch (type) {
      case ExplorerDataType.TRANSACTION:
        return `https://goerli.arbiscan.io/tx/${data}`
      case ExplorerDataType.ADDRESS:
      case ExplorerDataType.TOKEN:
        return `https://goerli.arbiscan.io/address/${data}`
      case ExplorerDataType.BLOCK:
        return `https://goerli.arbiscan.io/block/${data}`
      default:
        return `https://goerli.arbiscan.io/`
    }
  }

  const prefix = BLOCK_EXPLORER_PREFIXES[chainId] ?? 'https://etherscan.io'

  switch (type) {
    case ExplorerDataType.TRANSACTION:
      return `${prefix}/tx/${data}`

    case ExplorerDataType.TOKEN:
      return `${prefix}/token/${data}`

    case ExplorerDataType.BLOCK:
      if (chainId === ChainId.OPTIMISM || chainId === ChainId.OPTIMISM_GOERLI) {
        return `${prefix}/tx/${data}`
      }
      return `${prefix}/block/${data}`

    case ExplorerDataType.ADDRESS:
      return `${prefix}/address/${data}`
    default:
      return `${prefix}`
  }
}
