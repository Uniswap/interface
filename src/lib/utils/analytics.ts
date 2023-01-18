import { Currency, Percent, Price } from '@uniswap/sdk-core'

const formatPercentInBasisPointsNumber = (percent: Percent): number => parseFloat(percent.toFixed(2)) * 100

export const getPriceUpdateBasisPoints = (
  prevPrice: Price<Currency, Currency>,
  newPrice: Price<Currency, Currency>
): number => {
  const changeFraction = newPrice.subtract(prevPrice).divide(prevPrice)
  const changePercentage = new Percent(changeFraction.numerator, changeFraction.denominator)
  return formatPercentInBasisPointsNumber(changePercentage)
}
