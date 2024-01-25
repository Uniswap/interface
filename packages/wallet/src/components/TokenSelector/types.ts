import { CurrencyInfo } from 'wallet/src/features/dataApi/types'

export type TokenOption = {
  currencyInfo: CurrencyInfo
  quantity: number | null // float representation of balance, returned by data-api
  balanceUSD: Maybe<number>
}

export type OnSelectCurrency = (
  currency: CurrencyInfo,
  section: SuggestedTokenSection | TokenSection,
  index: number
) => void

export type TokenSection = {
  title: string
  data: TokenOption[]
  rightElement?: JSX.Element
}

export type SuggestedTokenSection = {
  title: string
  data: TokenOption[][]
  rightElement?: JSX.Element
}

export type TokenSelectorListSections = Array<SuggestedTokenSection | TokenSection>
