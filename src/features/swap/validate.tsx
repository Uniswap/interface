import { TFunction } from 'i18next'
import { UseQueryResult } from 'react-query'
import { ChainId } from 'src/constants/chains'
import { DerivedSwapInfo } from 'src/features/swap/hooks'
import { CurrencyField } from 'src/features/swap/swapFormSlice'
import { Account, AccountType } from 'src/features/wallet/accounts/types'

enum FieldError {
  INSUFFICIENT_FUNDS,
  MISSING_INPUT_AMOUNT,
  MISSING_INPUT_CURRENCY,
  MISSING_OUTPUT_AMOUNT,
  MISSING_OUTPUT_CURRENCY,
  UNSUPPORTED_NETWORK,
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
  if (activeAccount && activeAccount.type === AccountType.readonly) {
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
    case FieldError.UNSUPPORTED_NETWORK:
      return t('Switch to Rinkeby')
  }
}

function validateSwapInfo(swapInfo: DerivedSwapInfo) {
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

  const exactCurrencyAmount = currencyAmounts[CurrencyField.INPUT]
  const balance = currencyBalances[CurrencyField.INPUT]
  if (!balance || (exactCurrencyAmount && balance.lessThan(exactCurrencyAmount))) {
    return FieldError.INSUFFICIENT_FUNDS
  }

  // TODO: temporary check to restrict swapping to Rinkeby
  if (currencies[exactCurrencyField]?.chainId !== ChainId.RINKEBY) {
    return FieldError.UNSUPPORTED_NETWORK
  }

  return null
}
