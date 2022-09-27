import { SupportedChainId } from '../constants/chains'

const BLOCK_EXPLORER_PREFIXES: { [chainId: number]: string } = {
  [SupportedChainId.MAINNET]: 'https://etherscan.io',
  [SupportedChainId.ROPSTEN]: 'https://ropsten.etherscan.io',
  [SupportedChainId.RINKEBY]: 'https://rinkeby.etherscan.io',
  [SupportedChainId.GOERLI]: 'https://goerli.etherscan.io',
  [SupportedChainId.KOVAN]: 'https://kovan.etherscan.io',
  [SupportedChainId.OPTIMISM]: 'https://optimistic.etherscan.io',
  [SupportedChainId.OPTIMISM_GOERLI]: 'https://goerli-optimism.etherscan.io',
  [SupportedChainId.POLYGON]: 'https://polygonscan.com',
  [SupportedChainId.POLYGON_MUMBAI]: 'https://mumbai.polygonscan.com',
  [SupportedChainId.CELO]: 'https://celoscan.io',
  [SupportedChainId.CELO_ALFAJORES]: 'https://alfajores-blockscout.celo-testnet.org',
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
  if (chainId === SupportedChainId.ARBITRUM_ONE) {
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

  if (chainId === SupportedChainId.ARBITRUM_RINKEBY) {
    switch (type) {
      case ExplorerDataType.TRANSACTION:
        return `https://rinkeby-explorer.arbitrum.io/tx/${data}`
      case ExplorerDataType.ADDRESS:
      case ExplorerDataType.TOKEN:
        return `https://rinkeby-explorer.arbitrum.io/address/${data}`
      case ExplorerDataType.BLOCK:
        return `https://rinkeby-explorer.arbitrum.io/block/${data}`
      default:
        return `https://rinkeby-explorer.arbitrum.io/`
    }
  }

  const prefix = BLOCK_EXPLORER_PREFIXES[chainId] ?? 'https://etherscan.io'

  switch (type) {
    case ExplorerDataType.TRANSACTION:
      return `${prefix}/tx/${data}`

    case ExplorerDataType.TOKEN:
      return `${prefix}/token/${data}`

    case ExplorerDataType.BLOCK:
      if (chainId === SupportedChainId.OPTIMISM || chainId === SupportedChainId.OPTIMISM_GOERLI) {
        return `${prefix}/tx/${data}`
      }
      return `${prefix}/block/${data}`

    case ExplorerDataType.ADDRESS:
      return `${prefix}/address/${data}`
    default:
      return `${prefix}`
  }
}
