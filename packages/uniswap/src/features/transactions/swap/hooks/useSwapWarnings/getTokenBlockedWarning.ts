import { TFunction } from 'i18next'
import { Warning, WarningAction, WarningLabel, WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { TokenList } from 'uniswap/src/features/dataApi/types'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { CurrencyField } from 'uniswap/src/types/currency'

export function getTokenBlockedWarning(t: TFunction, currencies: DerivedSwapInfo['currencies']): Warning | undefined {
  const isInputTokenBlocked = currencies[CurrencyField.INPUT]?.safetyInfo?.tokenList === TokenList.Blocked
  const isOutputTokenBlocked = currencies[CurrencyField.OUTPUT]?.safetyInfo?.tokenList === TokenList.Blocked
  const inputTokenSymbol = currencies[CurrencyField.INPUT]?.currency.symbol
  const outputTokenSymbol = currencies[CurrencyField.OUTPUT]?.currency.symbol

  if (!isInputTokenBlocked && !isOutputTokenBlocked) {
    return undefined
  }

  const buttonText = t('swap.warning.tokenBlocked.button', {
    tokenSymbol: (isInputTokenBlocked ? inputTokenSymbol : outputTokenSymbol) ?? '',
  })

  return {
    type: WarningLabel.BlockedToken,
    severity: WarningSeverity.Blocked,
    action: WarningAction.DisableReview,
    buttonText:
      (isInputTokenBlocked && !inputTokenSymbol) || (isOutputTokenBlocked && !outputTokenSymbol)
        ? t('swap.warning.tokenBlockedFallback.button')
        : buttonText,
  }
}
