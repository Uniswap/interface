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

// do not change the order of these enum values without a migration since they are persisted in the redux store
export enum SearchHistoryResultType {
  Token = 0,
  Etherscan = 1,
  // NFTCollection = 2, - removed, but should not be reintroduced for number stability of search history results
  WalletByAddress = 3,
  Pool = 4,
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
