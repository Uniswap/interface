import { TFunction } from 'i18next'
import { Warning, WarningAction, WarningLabel, WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { CurrencyField } from 'uniswap/src/types/currency'
import { isWebPlatform } from 'utilities/src/platform'

export function getBalanceWarning({
  t,
  currencyBalances,
  currencyAmounts,
}: {
  t: TFunction
  currencyBalances: DerivedSwapInfo['currencyBalances']
  currencyAmounts: DerivedSwapInfo['currencyAmounts']
}): Warning | undefined {
  const currencyBalanceIn = currencyBalances[CurrencyField.INPUT]
  const currencyAmountIn = currencyAmounts[CurrencyField.INPUT]
  const swapBalanceInsufficient = currencyAmountIn && currencyBalanceIn?.lessThan(currencyAmountIn)
  const currencySymbol = currencyAmountIn?.currency.symbol ?? ''

  if (!swapBalanceInsufficient) {
    return undefined
  }

  return {
    type: WarningLabel.InsufficientFunds,
    severity: WarningSeverity.None,
    action: WarningAction.DisableReview,
    title: t('swap.warning.insufficientBalance.title', {
      currencySymbol,
    }),
    buttonText: isWebPlatform
      ? t('common.insufficientTokenBalance.error.simple', {
          tokenSymbol: currencySymbol,
        })
      : undefined,
    currency: currencyAmountIn.currency,
  }
}
