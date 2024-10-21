import { SafetyLevel } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { SafetyInfo } from 'uniswap/src/features/dataApi/types'
import { UniverseChainId } from 'uniswap/src/types/chains'

export type SearchResult = TokenSearchResult | WalletSearchResult | EtherscanSearchResult | NFTCollectionSearchResult

export type InterfaceSearchResult = TokenSearchResult | NFTCollectionSearchResult

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
  safetyInfo?: SafetyInfo | null
}

export function isTokenSearchResult(x: SearchResult): x is TokenSearchResult {
  return x.type === SearchResultType.Token
}

export interface NFTCollectionSearchResult extends SearchResultBase {
  type: SearchResultType.NFTCollection
  chainId: UniverseChainId
  address: Address
  name: string
  imageUrl: string | null
  isVerified: boolean
}

export function isNFTCollectionSearchResult(x: SearchResult): x is NFTCollectionSearchResult {
  return x.type === SearchResultType.NFTCollection
}

export interface EtherscanSearchResult extends SearchResultBase {
  type: SearchResultType.Etherscan
  address: Address
}

export type WalletSearchResult = ENSAddressSearchResult | UnitagSearchResult | WalletByAddressSearchResult

export interface WalletByAddressSearchResult extends SearchResultBase {
  type: SearchResultType.WalletByAddress
  address: Address
}

export interface ENSAddressSearchResult extends SearchResultBase {
  type: SearchResultType.ENSAddress
  address: Address
  isRawName?: boolean
  ensName: string
  primaryENSName?: string
}

export interface UnitagSearchResult extends SearchResultBase {
  type: SearchResultType.Unitag
  address: Address
  unitag: string
}

export function extractDomain(walletName: string, type: SearchResultType): string {
  const index = walletName.indexOf('.')
  if (index === -1 || index === walletName.length - 1) {
    return type === SearchResultType.Unitag ? '.uni.eth' : '.eth'
  }

  return walletName.substring(index + 1)
}
