import { Percent } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import { TFunction } from 'i18next'
import { AlertTriangleFilled } from 'ui/src/components/icons'
import { Warning, WarningAction, WarningLabel, WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import {
  BRIDGE_PRICE_DIFFERENCE_CRITICAL_THRESHOLD,
  BRIDGE_PRICE_DIFFERENCE_WARNING_THRESHOLD,
  CHAINED_PRICE_DIFFERENCE_CRITICAL_THRESHOLD,
  CHAINED_PRICE_DIFFERENCE_WARNING_THRESHOLD,
  PRICE_DIFFERENCE_CRITICAL_THRESHOLD,
  PRICE_DIFFERENCE_WARNING_THRESHOLD,
} from 'uniswap/src/constants/transactions'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { LocalizationContextState } from 'uniswap/src/features/language/LocalizationContext'
import { formatPriceDifference } from 'uniswap/src/features/transactions/swap/utils/formatPriceDifference'

function toPercent(threshold: number): Percent {
  // Math.round because Percent/Fraction rejects non-integers (e.g. 1.1 * 100 = 110.00000000000001)
  return new Percent(Math.round(threshold * 100), 10000)
}

function getThresholds(routing: TradingApi.Routing | undefined): { medium: Percent; high: Percent } {
  switch (routing) {
    case TradingApi.Routing.CHAINED:
      return {
        medium: toPercent(CHAINED_PRICE_DIFFERENCE_WARNING_THRESHOLD),
        high: toPercent(CHAINED_PRICE_DIFFERENCE_CRITICAL_THRESHOLD),
      }
    case TradingApi.Routing.BRIDGE:
      return {
        medium: toPercent(BRIDGE_PRICE_DIFFERENCE_WARNING_THRESHOLD),
        high: toPercent(BRIDGE_PRICE_DIFFERENCE_CRITICAL_THRESHOLD),
      }
    default:
      return {
        medium: toPercent(PRICE_DIFFERENCE_WARNING_THRESHOLD),
        high: toPercent(PRICE_DIFFERENCE_CRITICAL_THRESHOLD),
      }
  }
}

export function getPriceDifferenceWarning({
  t,
  priceDifference,
  routing,
  formatPercent,
}: {
  t: TFunction
  priceDifference?: Percent
  routing?: TradingApi.Routing
  formatPercent: LocalizationContextState['formatPercent']
}): Warning | undefined {
  const { medium, high } = getThresholds(routing)

  // only show an error if the price difference is defined and greater than the threshold
  if (!priceDifference?.greaterThan(medium)) {
    return undefined
  }

  const priceImpactValue = formatPriceDifference(priceDifference, formatPercent) ?? ''
  const highImpact = !priceDifference.lessThan(high)

  return {
    type: highImpact ? WarningLabel.PriceDifferenceHigh : WarningLabel.PriceDifferenceMedium,
    severity: highImpact ? WarningSeverity.High : WarningSeverity.Medium,
    action: WarningAction.WarnBeforeSubmit,
    icon: AlertTriangleFilled,
    title: t('swap.warning.priceImpact.title', {
      priceImpactValue,
    }),
    message: t('swap.warning.priceImpact.message', {
      priceImpactValue,
    }),
    link: UniswapHelpUrls.articles.priceImpact,
  }
}
