import type { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import JSBI from 'jsbi'
import type {
  PresetPercentage,
  PresetPercentageNumber,
} from 'uniswap/src/components/CurrencyInputPanel/AmountInputPresets/types'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'

const PRESET_MAX = 100
export const PRESET_PERCENTAGES: PresetPercentage[] = [25, 50, 75, 100]

export function isMaxPercentage(percentage: PresetPercentage): percentage is 100 | 'max' {
  return percentage === PRESET_MAX || percentage === 'max'
}

/**
 * Returns the currency amount for the specified percentage of the passed in raw value.
 * If the currency amount is less than the max amount the user has it returns 0.
 */
function getPercentageOfCurrencyAmount({
  currency,
  rawBalanceAmount,
  percent,
  rawMaxAmount,
}: {
  currency: Maybe<Currency>
  rawBalanceAmount: Maybe<JSBI>
  percent: PresetPercentageNumber
  rawMaxAmount?: JSBI
}): Maybe<CurrencyAmount<Currency>> {
  if (!rawBalanceAmount) {
    return undefined
  }

  const rawPercentageValue = JSBI.divide(JSBI.multiply(rawBalanceAmount, JSBI.BigInt(percent)), JSBI.BigInt(100))

  // return the minimum of the rawMaxAmount and the rawPercantageValue to account for gas
  const amount = JSBI.GT(rawPercentageValue, rawMaxAmount) ? rawMaxAmount : rawPercentageValue

  return getCurrencyAmount({
    value: amount?.toString() ?? '0',
    valueType: ValueType.Raw,
    currency,
  })
}

/** The amount a preset sets: the max spendable for Max, otherwise that share of the balance, capped at the max. */
export function getPresetAmount({
  percentage,
  currency,
  rawBalanceAmount,
  maxInputAmount,
}: {
  percentage: PresetPercentage
  currency: Maybe<Currency>
  rawBalanceAmount: Maybe<JSBI>
  maxInputAmount: Maybe<CurrencyAmount<Currency>>
}): Maybe<CurrencyAmount<Currency>> {
  if (isMaxPercentage(percentage)) {
    return maxInputAmount
  }

  return getPercentageOfCurrencyAmount({
    currency,
    rawBalanceAmount,
    percent: percentage,
    rawMaxAmount: maxInputAmount?.quotient,
  })
}

/** Disables a preset when there is nothing to fill, or Max is already set. */
export function isPresetAmountDisabled({
  percentage,
  presetAmount,
  currencyAmount,
}: {
  percentage: PresetPercentage
  presetAmount: Maybe<CurrencyAmount<Currency>>
  currencyAmount: Maybe<CurrencyAmount<Currency>>
}): boolean {
  return (
    !presetAmount ||
    !presetAmount.greaterThan(0) ||
    (isMaxPercentage(percentage) && currencyAmount?.toExact() === presetAmount.toExact())
  )
}
