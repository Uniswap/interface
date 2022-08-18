import { Currency } from '@uniswap/sdk-core'

export type TokenOption = {
  currency: Currency
  quantity: number | null // float representation of balance, returned by data-api
  balanceUSD: number | null
}
