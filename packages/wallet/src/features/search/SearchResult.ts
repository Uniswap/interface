import { SafetyLevel } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { ChainId } from 'wallet/src/constants/chains'

export type SearchResult =
  | TokenSearchResult
  | WalletSearchResult
  | EtherscanSearchResult
  | NFTCollectionSearchResult

// Retain original ordering as these are saved to storage and loaded back out
export enum SearchResultType {
  ENSAddress,
  Token,
  Etherscan,
  NFTCollection,
  Unitag,
  WalletByAddress,
}

export function extractDomain(walletName: string, type: SearchResultType): string {
  const index = walletName.indexOf('.')
  if (index === -1 || index === walletName.length - 1) {
    return type === SearchResultType.Unitag ? '.uni.eth' : '.eth'
  }

  return walletName.substring(index + 1)
}

export interface SearchResultBase {
  type: SearchResultType
  searchId?: string
}

export type WalletSearchResult =
  | ENSAddressSearchResult
  | UnitagSearchResult
  | WalletByAddressSearchResult

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

export interface TokenSearchResult extends SearchResultBase {
  type: SearchResultType.Token
  chainId: ChainId
  symbol: string
  address: Address | null
  name: string | null
  logoUrl: string | null
  safetyLevel: SafetyLevel | null
}

export interface NFTCollectionSearchResult extends SearchResultBase {
  type: SearchResultType.NFTCollection
  chainId: ChainId
  address: Address
  name: string
  imageUrl: string | null
  isVerified: boolean
}

export interface EtherscanSearchResult extends SearchResultBase {
  type: SearchResultType.Etherscan
  address: Address
}
