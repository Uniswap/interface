import { Percent } from '@uniswap/sdk-core'
import { TFunction } from 'i18next'
import { Warning, WarningAction, WarningLabel, WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { LocalizationContextState } from 'uniswap/src/features/language/LocalizationContext'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { formatPriceImpact } from 'uniswap/src/features/transactions/swap/utils/formatPriceImpact'
import { CurrencyField } from 'uniswap/src/types/currency'

const PRICE_IMPACT_THRESHOLD_MEDIUM = new Percent(3, 100) // 3%
const PRICE_IMPACT_THRESHOLD_HIGH = new Percent(5, 100) // 5%

export function getPriceImpactWarning({
  t,
  priceImpact,
  formatPercent,
  currencies,
}: {
  t: TFunction
  priceImpact?: Percent
  formatPercent: LocalizationContextState['formatPercent']
  currencies: DerivedSwapInfo['currencies']
}): Warning | undefined {
  // only show an error if price impact is defined and greater than the threshold
  if (!priceImpact?.greaterThan(PRICE_IMPACT_THRESHOLD_MEDIUM)) {
    return undefined
  }

  const priceImpactValue = formatPriceImpact(priceImpact, formatPercent) ?? ''
  const highImpact = !priceImpact.lessThan(PRICE_IMPACT_THRESHOLD_HIGH)

  return {
    type: highImpact ? WarningLabel.PriceImpactHigh : WarningLabel.PriceImpactMedium,
    severity: highImpact ? WarningSeverity.High : WarningSeverity.Medium,
    action: WarningAction.WarnBeforeSubmit,
    title: highImpact
      ? t('swap.warning.priceImpact.title.veryHigh', {
          priceImpactValue,
        })
      : t('swap.warning.priceImpact.title', {
          priceImpactValue,
        }),
    message: highImpact
      ? t('swap.warning.priceImpact.message.veryHigh', { priceImpactValue })
      : t('swap.warning.priceImpact.message', {
          outputCurrencySymbol: currencies[CurrencyField.OUTPUT]?.currency.symbol ?? '',
          inputCurrencySymbol: currencies[CurrencyField.INPUT]?.currency.symbol ?? '',
        }),
    link: uniswapUrls.helpArticleUrls.priceImpact,
  }
}
