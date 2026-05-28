/*
 * Represents the search result types that are saved in Redux.
 */
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyId } from 'uniswap/src/types/currency'

export type SearchHistoryResult =
  | TokenSearchHistoryResult
  | WalletByAddressSearchHistoryResult
  | EtherscanSearchHistoryResult
  | PoolSearchHistoryResult
  | MultichainTokenSearchHistoryResult

// do not change the order of these enum values without a migration since they are persisted in the redux store
export enum SearchHistoryResultType {
  Token = 0,
  Etherscan = 1,
  // NFTCollection = 2, - removed, but should not be reintroduced for number stability of search history results
  WalletByAddress = 3,
  Pool = 4,
  MultichainToken = 5,
}

interface SearchResultBase {
  type: SearchHistoryResultType
  searchId?: string
}

export interface TokenSearchHistoryResult extends SearchResultBase {
  type: SearchHistoryResultType.Token
  chainId: UniverseChainId
  address: Address | null
}

export function isTokenSearchHistoryResult(x: SearchHistoryResult): x is TokenSearchHistoryResult {
  return x.type === SearchHistoryResultType.Token
}

export interface MultichainTokenSearchHistoryResult extends SearchResultBase {
  type: SearchHistoryResultType.MultichainToken
  multichainId: string
  name: string
  symbol: string
  logoUrl?: string
  /** Per-chain currency rows, first entry is the primary (same order as search UI). */
  tokenCurrencyIds: CurrencyId[]
  /** When set, TDP opens with this network selected (`?chain=`). */
  tdpChainFilter?: UniverseChainId
}

export function isMultichainTokenSearchHistoryResult(x: SearchHistoryResult): x is MultichainTokenSearchHistoryResult {
  return x.type === SearchHistoryResultType.MultichainToken
}

// TODO(CONS-419): Should not contain feeTier in saved redux state -- this can be dynamic and should be re-fetched at calltime
export interface PoolSearchHistoryResult extends SearchResultBase {
  type: SearchHistoryResultType.Pool
  chainId: UniverseChainId
  poolId: string
  protocolVersion: ProtocolVersion
  hookAddress?: Address
  feeTier: number
  token0CurrencyId: CurrencyId
  token1CurrencyId: CurrencyId
}

export function isPoolSearchHistoryResult(x: SearchHistoryResult): x is PoolSearchHistoryResult {
  return x.type === SearchHistoryResultType.Pool
}

export interface EtherscanSearchHistoryResult extends SearchResultBase {
  type: SearchHistoryResultType.Etherscan
  address: Address
}

export function isEtherscanSearchHistoryResult(x: SearchHistoryResult): x is EtherscanSearchHistoryResult {
  return x.type === SearchHistoryResultType.Etherscan
}

export function isWalletSearchHistoryResult(x: SearchHistoryResult): x is WalletByAddressSearchHistoryResult {
  return x.type === SearchHistoryResultType.WalletByAddress
}

export interface WalletByAddressSearchHistoryResult extends SearchResultBase {
  type: SearchHistoryResultType.WalletByAddress
  address: Address
}
