import { ChainId } from 'wallet/src/constants/chains'
import { SafetyLevel } from 'wallet/src/data/__generated__/types-and-hooks'

export type SearchResult =
  | TokenSearchResult
  | WalletSearchResult
  | EtherscanSearchResult
  | NFTCollectionSearchResult

export enum SearchResultType {
  Wallet,
  Token,
  Etherscan,
  NFTCollection,
}

export interface SearchResultBase {
  type: SearchResultType
  searchId?: string
}

export interface WalletSearchResult extends SearchResultBase {
  type: SearchResultType.Wallet
  address: Address
  ensName?: string
  primaryENSName?: string
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
