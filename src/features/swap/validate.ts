import { TFunction } from 'i18next'
import { useDerivedSwapInfo } from 'src/features/swap/hooks'
import { CurrencyField } from 'src/features/swap/swapFormSlice'

export enum FieldError {
  INSUFFICIENT_FUNDS,
  MISSING_INPUT_AMOUNT,
  MISSING_INPUT_CURRENCY,
  MISSING_OUTPUT_AMOUNT,
  MISSING_OUTPUT_CURRENCY,
}

export function stringifySwapInfoError(error: FieldError | null, t: TFunction) {
  if (error === null) return ''

  switch (error) {
    case FieldError.MISSING_INPUT_AMOUNT:
      return t('Select an input amount')
    case FieldError.MISSING_OUTPUT_AMOUNT:
      return t('Select an output amount')
    case FieldError.MISSING_INPUT_CURRENCY:
      return t('Select an input currency')
    case FieldError.MISSING_OUTPUT_CURRENCY:
      return t('Select an output currency')
    case FieldError.INSUFFICIENT_FUNDS:
      return t('Insufficient funds')
    default:
      return t('Something went wrong')
  }
}

export function validateSwapInfo(
  swapInfo: ReturnType<typeof useDerivedSwapInfo>
): FieldError | null {
  const { currencies, currencyAmounts, currencyBalances, exactCurrencyField } = swapInfo

  // Note. order matters here

  if (!currencies[CurrencyField.INPUT]) {
    return FieldError.MISSING_INPUT_CURRENCY
  }

  if (!currencies[CurrencyField.OUTPUT]) {
    return FieldError.MISSING_OUTPUT_CURRENCY
  }

  if (exactCurrencyField === CurrencyField.INPUT && !currencyAmounts[CurrencyField.INPUT]) {
    return FieldError.MISSING_INPUT_AMOUNT
  }

  if (exactCurrencyField === CurrencyField.OUTPUT && !currencyAmounts[CurrencyField.OUTPUT]) {
    return FieldError.MISSING_OUTPUT_AMOUNT
  }

  const exactCurrencyAmount = currencyAmounts[exactCurrencyField]
  if (exactCurrencyAmount && currencyBalances[exactCurrencyField]?.lessThan(exactCurrencyAmount)) {
    return FieldError.INSUFFICIENT_FUNDS
  }

  // price impact
  // ...
  // TODO <InputError type={SwapInputErrorType={insufficient_funds, etc.}}
  // Interface leverages this to set the button text // act as a CTA
  // no parsed amount yet -> enter an amount
  // no currencies -> select a token
  // TODO: insufficient fund is input balance < max input based on quote

  return null
}
