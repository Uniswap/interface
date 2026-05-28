import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo, MultichainSearchResult } from 'uniswap/src/features/dataApi/types'

/* Types of list item options */
export enum OnchainItemListOptionType {
  Token = 'Token',
  MultichainToken = 'MultichainToken',
  Pool = 'Pool',
  WalletByAddress = 'WalletByAddress',
  ENSAddress = 'ENSAddress',
  Unitag = 'Unitag',
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

export interface MultichainTokenOption extends BaseOption {
  type: OnchainItemListOptionType.MultichainToken
  multichainResult: MultichainSearchResult
  primaryCurrencyInfo: CurrencyInfo
  /** From recent search history: open TDP with this `?chain=` when present. */
  tdpChainFilter?: UniverseChainId
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

// Union of item types for different list use cases
export type MobileExploreSearchModalOption = TokenOption | MultichainTokenOption | WalletOption
export type WebSearchModalOption = TokenOption | MultichainTokenOption | PoolOption | WalletOption
export type SearchModalOption = MobileExploreSearchModalOption | WebSearchModalOption

export type TokenSelectorOption = TokenOption | TokenOption[]

// All item types combined
export type OnchainItemListOption = TokenSelectorOption | SearchModalOption
