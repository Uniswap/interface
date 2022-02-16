import { DAI_POLYGON_MUMBAI } from 'constants/tokens'

import { tryParseAmount } from '../swap/hooks'

interface IPurchaseBondInfoArgs {
  amount: string
  maxPrice: string
}

export function usePurchaseBondInfo({ amount, maxPrice }: IPurchaseBondInfoArgs) {
  const parsedAmount = tryParseAmount(amount, DAI_POLYGON_MUMBAI)
  const parsedMaxPrice = tryParseAmount(maxPrice)

  return {
    parsedAmount,
    parsedMaxPrice,
  }
}
