import { ProtocolVersion } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'

/* Types of list item options */
export type TokenOption = {
  currencyInfo: CurrencyInfo
  quantity: number | null // float representation of balance, returned by data-api
  balanceUSD: Maybe<number>
  isUnsupported?: boolean
}

export type PoolOption = {
  poolId: string
  chainId: UniverseChainId
  token0CurrencyInfo: CurrencyInfo
  token1CurrencyInfo: CurrencyInfo
  protocolVersion: ProtocolVersion
  hookAddress?: string
  feeTier: number
}

// Union of item types for different list use cases
export type SearchModalItemTypes = TokenOption | PoolOption
export type TokenSelectorItemTypes = TokenOption | TokenOption[]

// All item types combined
export type ItemType = TokenSelectorItemTypes | SearchModalItemTypes

export function isPoolOption(item: ItemType): item is PoolOption {
  return 'poolId' in item
}

export function isTokenOption(item: ItemType): item is TokenOption {
  return 'currencyInfo' in item
}
