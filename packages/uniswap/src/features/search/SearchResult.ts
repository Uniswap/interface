/*
 * Represents the search result types that are saved in Redux and are used in legacy mobile search.
 *
 * For now are 1:1 with the types in new search's OnchainItemListOptions
 * TODO(WEB-6283): Should only really contain 'SearchResultType & address'. All other data is dynamic and should be re-fetched at calltime (currencyInfo, primaryENSName, ENSname, etc)
 */
import { FeeData, ProtocolVersion } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { SafetyInfo } from 'uniswap/src/features/dataApi/types'
import { ENS_SUFFIX } from 'uniswap/src/features/ens/constants'
import { UNITAG_SUBDOMAIN, UNITAG_SUFFIX } from 'uniswap/src/features/unitags/constants'
import { CurrencyId } from 'uniswap/src/types/currency'

export type SearchResult =
  | TokenSearchResult
  | WalletSearchResult
  | EtherscanSearchResult
  | NFTCollectionSearchResult
  | PoolSearchResult

export type InterfaceSearchResult = TokenSearchResult | PoolSearchResult

export enum SearchResultType {
  ENSAddress = 0,
  Token = 1,
  Etherscan = 2,
  NFTCollection = 3,
  Unitag = 4,
  WalletByAddress = 5,
  Pool = 6,
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

export interface PoolSearchResult extends SearchResultBase {
  type: SearchResultType.Pool
  chainId: UniverseChainId
  poolId: string
  protocolVersion: ProtocolVersion
  hookAddress?: Address
  feeTier: number
  token0CurrencyId: CurrencyId
  token1CurrencyId: CurrencyId
}

export function isPoolSearchResult(x: SearchResult): x is PoolSearchResult {
  return x.type === SearchResultType.Pool
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

export function isEtherscanSearchResult(x: SearchResult): x is EtherscanSearchResult {
  return x.type === SearchResultType.Etherscan
}

export type WalletSearchResult = ENSAddressSearchResult | UnitagSearchResult | WalletByAddressSearchResult

export function isWalletSearchResult(x: SearchResult): x is WalletSearchResult {
  return (
    x.type === SearchResultType.WalletByAddress ||
    x.type === SearchResultType.ENSAddress ||
    x.type === SearchResultType.Unitag
  )
}

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
