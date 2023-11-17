import { ChainId } from '@uniswap/sdk-core'

const BLOCK_EXPLORER_PREFIXES: { [chainId: number]: string } = {
  [ChainId.MAINNET]: 'https://etherscan.io',
  [ChainId.GOERLI]: 'https://goerli.etherscan.io',
  [ChainId.SEPOLIA]: 'https://sepolia.etherscan.io',
  [ChainId.ARBITRUM_ONE]: 'https://arbiscan.io',
  [ChainId.ARBITRUM_GOERLI]: 'https://goerli.arbiscan.io',
  [ChainId.OPTIMISM]: 'https://optimistic.etherscan.io',
  [ChainId.OPTIMISM_GOERLI]: 'https://goerli-optimism.etherscan.io',
  [ChainId.POLYGON]: 'https://polygonscan.com',
  [ChainId.POLYGON_MUMBAI]: 'https://mumbai.polygonscan.com',
  [ChainId.CELO]: 'https://celoscan.io',
  [ChainId.CELO_ALFAJORES]: 'https://alfajores-blockscout.celo-testnet.org',
  [ChainId.BNB]: 'https://bscscan.com',
  [ChainId.AVALANCHE]: 'https://snowtrace.io',
  [ChainId.BASE]: 'https://basescan.org',
}

export enum ExplorerDataType {
  TRANSACTION = 'transaction',
  TOKEN = 'token',
  ADDRESS = 'address',
  BLOCK = 'block',
  NATIVE = 'native',
}

/**
 * Return the explorer link for the given data and data type
 * @param chainId the ID of the chain for which to return the data
 * @param data the data to return a link for
 * @param type the type of the data
 */
export function getExplorerLink(chainId: number, data: string, type: ExplorerDataType): string {
  const prefix = BLOCK_EXPLORER_PREFIXES[chainId] ?? 'https://etherscan.io'

  switch (type) {
    case ExplorerDataType.TRANSACTION:
      return `${prefix}/tx/${data}`

    case ExplorerDataType.TOKEN:
      return `${prefix}/token/${data}`

    case ExplorerDataType.BLOCK:
      return `${prefix}/block/${data}`

    case ExplorerDataType.ADDRESS:
      return `${prefix}/address/${data}`
    default:
      return `${prefix}`
  }
}
