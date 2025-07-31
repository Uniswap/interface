import { Currency, Price } from '@uniswap/sdk-core'
import { PriceDifference } from 'components/Liquidity/Create/types'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'

const WARNING_PRICE_DIFFERENCE_PERCENTAGE = 5
const CRITICAL_PRICE_DIFFERENCE_PERCENTAGE = 10

export function getPriceDifference({
  initialPrice,
  defaultInitialPrice,
  priceInverted,
}: {
  initialPrice: string
  defaultInitialPrice?: Price<Currency, Currency>
  priceInverted: boolean
}): PriceDifference | undefined {
  // Roughly estimate the price difference between the initialPrice (user input)
  // and the defaultInitialPrice (derived from a quote) if we have both.
  const initialPriceNumber = Number(initialPrice)
  const defaultInitialPriceNumber = priceInverted
    ? Number(defaultInitialPrice?.invert().toSignificant(8))
    : Number(defaultInitialPrice?.toSignificant(8))

  if (!initialPriceNumber || !defaultInitialPriceNumber) {
    return undefined
  }

  const priceDifference = initialPriceNumber - defaultInitialPriceNumber
  const priceDifferencePercentage = (priceDifference / defaultInitialPriceNumber) * 100
  const priceDifferencePercentageRounded = Math.round(priceDifferencePercentage)
  const priceDifferencePercentageAbsolute = Math.abs(priceDifferencePercentageRounded)

  let warning: WarningSeverity | undefined
  if (priceDifferencePercentageAbsolute > CRITICAL_PRICE_DIFFERENCE_PERCENTAGE) {
    warning = WarningSeverity.High
  } else if (priceDifferencePercentageAbsolute > WARNING_PRICE_DIFFERENCE_PERCENTAGE) {
    warning = WarningSeverity.Medium
  }

  return {
    value: priceDifferencePercentageRounded,
    absoluteValue: priceDifferencePercentageAbsolute,
    warning,
  }
}
