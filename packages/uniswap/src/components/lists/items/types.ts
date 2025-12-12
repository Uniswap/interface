import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'

/* Types of list item options */
export enum OnchainItemListOptionType {
  Token = 'Token',
  Pool = 'Pool',
  WalletByAddress = 'WalletByAddress',
  ENSAddress = 'ENSAddress',
  Unitag = 'Unitag',
  NFTCollection = 'NFTCollection',
}

export interface BaseOption {
  type: OnchainItemListOptionType
}

export interface TokenOption extends BaseOption {
  type: OnchainItemListOptionType.Token
  currencyInfo: CurrencyInfo
  quantity: number | null // float representation of balance, returned by data-api
  balanceUSD: Maybe<number>
  isUnsupported?: boolean
}

export interface PoolOption extends BaseOption {
  type: OnchainItemListOptionType.Pool
  poolId: string
  chainId: UniverseChainId
  token0CurrencyInfo: CurrencyInfo
  token1CurrencyInfo: CurrencyInfo
  protocolVersion: ProtocolVersion
  hookAddress?: string
  feeTier: number
}

export type WalletOption = WalletByAddressOption | ENSAddressOption | UnitagOption

export interface WalletByAddressOption extends BaseOption {
  type: OnchainItemListOptionType.WalletByAddress
  address: Address
}
export interface ENSAddressOption extends BaseOption {
  type: OnchainItemListOptionType.ENSAddress
  address: Address
  isRawName?: boolean
  ensName: string
  primaryENSName?: string
}

export interface UnitagOption extends BaseOption {
  type: OnchainItemListOptionType.Unitag
  address: Address
  unitag: string
}

export interface NFTCollectionOption extends BaseOption {
  type: OnchainItemListOptionType.NFTCollection
  chainId: UniverseChainId
  address: Address
  name: string
  imageUrl: string | null
  isVerified: boolean
}
// Union of item types for different list use cases
export type MobileExploreSearchModalOption = TokenOption | WalletOption | NFTCollectionOption
export type WebSearchModalOption = TokenOption | PoolOption
export type SearchModalOption = MobileExploreSearchModalOption | WebSearchModalOption

export type TokenSelectorOption = TokenOption | TokenOption[]

// All item types combined
export type OnchainItemListOption = TokenSelectorOption | SearchModalOption
