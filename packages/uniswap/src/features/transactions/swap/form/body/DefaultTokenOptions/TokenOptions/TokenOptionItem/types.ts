import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import type { CurrencyField } from 'uniswap/src/types/currency'

export type TokenOptionItemProps = {
  currencyInfo: CurrencyInfo
  index: number
  numOptions: number
  currencyField: CurrencyField
}
