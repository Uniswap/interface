import { SafetyLevel } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { UniverseChainId } from 'uniswap/src/types/chains'

// Retain original ordering as these are saved to storage and loaded back out
export enum SearchResultType {
  ENSAddress,
  Token,
  Etherscan,
  NFTCollection,
  Unitag,
  WalletByAddress,
}

export interface SearchResultBase {
  type: SearchResultType
  searchId?: string
}

export interface TokenSearchResult extends SearchResultBase {
  type: SearchResultType.Token
  chainId: UniverseChainId
  symbol: string
  address: Address | null
  name: string | null
  logoUrl: string | null
  safetyLevel: SafetyLevel | null
}
