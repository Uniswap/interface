import { Currency, CurrencyAmount, Percent, Token } from '@uniswap/sdk-core'

export const getDurationTillTimestampSinceEpochSeconds = (futureTimestampSinceEpoch?: number): number | undefined => {
  if (!futureTimestampSinceEpoch) return undefined
  return futureTimestampSinceEpoch - new Date().getTime() / 1000
}

export const getDurationFromDateTillNowMilliseconds = (date: Date): number => {
  return Math.abs(new Date().getUTCMilliseconds() - date.getUTCMilliseconds())
}

export const getNumberFormattedToDecimalPlace = (
  intialNumberObject: Percent | CurrencyAmount<Token | Currency>,
  decimalPlace: number
): number => parseFloat(intialNumberObject.toFixed(decimalPlace))

export const formatPercentInBasisPointsNumber = (percent: Percent): number => parseFloat(percent.toFixed(2)) * 100
