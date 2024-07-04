import { UniverseChainId } from 'uniswap/src/types/chains'

const BLOCK_EXPLORER_PREFIXES: { [chainId: number]: string } = {
  [UniverseChainId.Mainnet]: 'https://etherscan.io',
  [UniverseChainId.Goerli]: 'https://goerli.etherscan.io',
  [UniverseChainId.Sepolia]: 'https://sepolia.etherscan.io',
  [UniverseChainId.ArbitrumOne]: 'https://arbiscan.io',
  [UniverseChainId.ArbitrumGoerli]: 'https://goerli.arbiscan.io',
  [UniverseChainId.Optimism]: 'https://optimistic.etherscan.io',
  [UniverseChainId.OptimismGoerli]: 'https://goerli-optimism.etherscan.io',
  [UniverseChainId.Polygon]: 'https://polygonscan.com',
  [UniverseChainId.PolygonMumbai]: 'https://mumbai.polygonscan.com',
  [UniverseChainId.Celo]: 'https://celoscan.io',
  [UniverseChainId.CeloAlfajores]: 'https://alfajores-blockscout.celo-testnet.org',
  [UniverseChainId.Bnb]: 'https://bscscan.com',
  [UniverseChainId.Avalanche]: 'https://snowtrace.io',
  [UniverseChainId.Base]: 'https://basescan.org',
  [UniverseChainId.Blast]: 'https://blastscan.io',
  [UniverseChainId.Zora]: 'https://zora.superscan.network',
  [UniverseChainId.Zksync]: 'https://explorer.zksync.io',
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
