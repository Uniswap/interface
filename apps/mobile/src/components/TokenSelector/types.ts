import { Currency } from '@uniswap/sdk-core'
import { CurrencyInfo } from 'wallet/src/features/dataApi/types'

export type TokenOption = {
  currencyInfo: CurrencyInfo
  quantity: number | null // float representation of balance, returned by data-api
  balanceUSD: Maybe<number>
}

export type OnSelectCurrency = (
  currency: Currency,
  section: SuggestedTokenSection | TokenSection,
  index: number
) => void

export type TokenSection = {
  title: string
  data: TokenOption[]
}

export type SuggestedTokenSection = {
  title: string
  data: TokenOption[][]
}

export type TokenSelectorListSections = Array<SuggestedTokenSection | TokenSection>

export enum TokenSelectorFlow {
  Swap,
  Transfer,
}
