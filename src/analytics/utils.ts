import { Currency, CurrencyAmount, Percent, Token } from '@uniswap/sdk-core'
import { NATIVE_CHAIN_ID } from 'constants/tokens'

export const getDurationUntilTimestampSeconds = (futureTimestampInSecondsSinceEpoch?: number): number | undefined => {
  if (!futureTimestampInSecondsSinceEpoch) return undefined
  return futureTimestampInSecondsSinceEpoch - new Date().getTime() / 1000
}

export const getDurationFromDateMilliseconds = (start: Date): number => {
  return new Date().getTime() - start.getTime()
}

export const formatToDecimal = (
  intialNumberObject: Percent | CurrencyAmount<Token | Currency>,
  decimalPlace: number
): number => parseFloat(intialNumberObject.toFixed(decimalPlace))

export const getTokenAddress = (currency: Currency) => (currency.isNative ? NATIVE_CHAIN_ID : currency.address)

export const formatPercentInBasisPointsNumber = (percent: Percent): number => parseFloat(percent.toFixed(2)) * 100

export const formatPercentNumber = (percent: Percent): number => parseFloat(percent.toFixed(2))
