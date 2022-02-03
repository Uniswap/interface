import { TFunction } from 'i18next'
import { UseQueryResult } from 'react-query'
import { DerivedSwapInfo } from 'src/features/swap/hooks'
import { CurrencyField } from 'src/features/swap/swapFormSlice'
import { Account, AccountType } from 'src/features/wallet/accounts/types'

enum FieldError {
  InsufficientFunds,
  MissingInputAmount,
  MissingInputCurrency,
  MissingOutputAmount,
  MissingOutputCurrency,
  UnsupportedNetwork,
}

/** Validates the entire DeriveSwapInfo payload for errors  */
export function getHumanReadableSwapInputStatus(
  activeAccount: Account | null,
  derivedSwapInfo: DerivedSwapInfo,
  t: TFunction
) {
  // chain function calls for early exits
  return (
    getHumanReadableInputError(validateSwapInfo(derivedSwapInfo), t) ??
    getHumanReadbleContextError(activeAccount, t) ??
    getHumanReadableQuoteStatus(derivedSwapInfo.trade.status, t)
  )
}

/** Errors specific to the current in which the swap is executing */
function getHumanReadbleContextError(activeAccount: Account | null, t: TFunction) {
  if (activeAccount && activeAccount.type === AccountType.Readonly) {
    return t('Cannot swap on watched account')
  }
  return null
}

function getHumanReadableQuoteStatus(status: UseQueryResult['status'], t: TFunction) {
  switch (status) {
    case 'error':
      return t('Failed to fetch a quote')
    case 'loading':
      return t('Fetching best price...')
  }

  return null
}

function getHumanReadableInputError(error: FieldError | null, t: TFunction) {
  if (error === null) return null

  switch (error) {
    case FieldError.MissingInputAmount:
      return t('Select an input amount')
    case FieldError.MissingOutputAmount:
      return t('Select an output amount')
    case FieldError.MissingInputCurrency:
      return t('Select an input currency')
    case FieldError.MissingOutputCurrency:
      return t('Select an output currency')
    case FieldError.InsufficientFunds:
      return t('Insufficient funds')
    case FieldError.UnsupportedNetwork:
      return t('Switch to Rinkeby')
  }
}

function validateSwapInfo(swapInfo: DerivedSwapInfo) {
  const { currencies, currencyAmounts, currencyBalances, exactCurrencyField } = swapInfo

  // Note. order matters here

  if (!currencies[CurrencyField.INPUT]) {
    return FieldError.MissingInputCurrency
  }

  if (!currencies[CurrencyField.OUTPUT]) {
    return FieldError.MissingOutputCurrency
  }

  if (exactCurrencyField === CurrencyField.INPUT && !currencyAmounts[CurrencyField.INPUT]) {
    return FieldError.MissingInputAmount
  }

  if (exactCurrencyField === CurrencyField.OUTPUT && !currencyAmounts[CurrencyField.OUTPUT]) {
    return FieldError.MissingOutputAmount
  }

  const exactCurrencyAmount = currencyAmounts[CurrencyField.INPUT]
  const balance = currencyBalances[CurrencyField.INPUT]
  if (!balance || (exactCurrencyAmount && balance.lessThan(exactCurrencyAmount))) {
    return FieldError.InsufficientFunds
  }

  return null
}
