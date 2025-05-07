import { FeeData } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { SafetyInfo } from 'uniswap/src/features/dataApi/types'
import { ENS_SUFFIX } from 'uniswap/src/features/ens/constants'
import { UNITAG_SUBDOMAIN, UNITAG_SUFFIX } from 'uniswap/src/features/unitags/constants'

export type SearchResult = TokenSearchResult | WalletSearchResult | EtherscanSearchResult | NFTCollectionSearchResult

export type InterfaceSearchResult = TokenSearchResult | NFTCollectionSearchResult

export enum SearchResultType {
  ENSAddress = 0,
  Token = 1,
  Etherscan = 2,
  NFTCollection = 3,
  Unitag = 4,
  WalletByAddress = 5,
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
  safetyInfo?: SafetyInfo | null
  feeData?: FeeData | null
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

export function extractDomain(walletName: string, type: SearchResultType.Unitag | SearchResultType.ENSAddress): string {
  const index = walletName.indexOf('.')
  if (index === -1 || index === walletName.length - 1) {
    return type === SearchResultType.Unitag ? UNITAG_SUFFIX : ENS_SUFFIX
  }

  const domain = walletName.substring(index)
  return domain === UNITAG_SUBDOMAIN ? UNITAG_SUFFIX : domain
}
