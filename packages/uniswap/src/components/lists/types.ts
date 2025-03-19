import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'

/* Types of list item options */
export type TokenOption = {
  currencyInfo: CurrencyInfo
  quantity: number | null // float representation of balance, returned by data-api
  balanceUSD: Maybe<number>
  isUnsupported?: boolean
}

// Union of item types for different list use cases
export type SearchModalItemTypes = TokenOption // TODO: will add PoolOption
export type TokenSelectorItemTypes = TokenOption | TokenOption[]

// All item types combined
export type ItemType = TokenSelectorItemTypes | SearchModalItemTypes
