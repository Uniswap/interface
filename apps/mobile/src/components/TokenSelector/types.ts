import { CurrencyInfo } from 'src/features/dataApi/types'

export type TokenOption = {
  currencyInfo: CurrencyInfo
  quantity: number | null // float representation of balance, returned by data-api
  balanceUSD: NullUndefined<number>
}
