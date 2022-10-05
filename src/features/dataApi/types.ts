import { Currency } from '@uniswap/sdk-core'
import { Chain } from 'src/features/dataApi/__generated__/tokenProjectsQuery.graphql'
import { CurrencyId } from 'src/utils/currencyId'

export type CurrencyInfo = {
  currency: Currency
  currencyId: CurrencyId
  logoUrl: NullUndefined<string>
}

// Portfolio balance as exposed to the app
export type PortfolioBalance = {
  quantity: number // float representation of balance
  balanceUSD: number
  currencyInfo: CurrencyInfo
  relativeChange24: number
}

export type GQLToken = {
  readonly chain: Chain
  readonly address: string | null
  readonly decimals: number | null
  readonly symbol: string | null
}

export type GQLTokenProject = {
  readonly tokens: readonly GQLToken[]
  readonly logoUrl: string | null
  readonly name: string | null
}
