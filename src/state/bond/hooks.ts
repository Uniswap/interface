import { Currency } from '@uniswap/sdk-core'

import { tryParseAmount } from '../swap/hooks'

interface IPurchaseBondInfoArgs {
  amount: number
  maxPrice: number
  token: Currency | undefined
}

export function usePurchaseBondInfo({ amount, maxPrice, token }: IPurchaseBondInfoArgs) {
  const parsedAmount = tryParseAmount(`${amount}`, token)
  const parsedMaxPrice = tryParseAmount(`${maxPrice}`)

  return {
    parsedAmount,
    parsedMaxPrice,
  }
}
