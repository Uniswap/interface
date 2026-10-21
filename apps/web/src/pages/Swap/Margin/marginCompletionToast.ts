import { normalizeTokenAddressForCache } from '@universe/chains'
import type { TFunction } from 'i18next'
import type {
  MarginActivePosition,
  MarginPlanResponse,
  MarginPosition,
  MarginTerminalPosition,
} from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import type { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import type { MarginManageAction } from 'uniswap/src/features/transactions/margin/types'
import { NumberType } from 'utilities/src/format/types'
import type { MarginMarketResolver } from '~/pages/Swap/Margin/hooks/useResolveMarginMarket'
import { formatLeverage, formatSignedFiat, rawToNumber } from '~/pages/Swap/Margin/marginFormat'
import { marginOpenedLeverage, marginPositionSubId, marginPositionTokens } from '~/pages/Swap/Margin/marginPositionRow'
import { marginFallbackPairLabel, marginMarketDirection } from '~/pages/Swap/Margin/marginTokenDisplay'
import { marginRawUsdToNumber } from '~/pages/Swap/Margin/marginUsdPnl'

type FormatNumberOrString = ReturnType<typeof useLocalizationContext>['formatNumberOrString']

// A row belongs to the plan when the pair matches (venue terms) and, if both sides carry one, the
// on-chain subId does.
function isRowForPlan({ row, plan }: { row: MarginPosition; plan: MarginPlanResponse }): boolean {
  const { collateralToken, debtToken } = marginPositionTokens(row)
  const subId = marginPositionSubId(row)
  return (
    normalizeTokenAddressForCache(collateralToken) === normalizeTokenAddressForCache(plan.collateralToken) &&
    normalizeTokenAddressForCache(debtToken) === normalizeTokenAddressForCache(plan.debtToken) &&
    (subId === undefined || subId === plan.subId)
  )
}

// Latest history row for the plan's market.
export function findLatestCloseForPlan({
  plan,
  history,
}: {
  plan: MarginPlanResponse
  history: MarginTerminalPosition[]
}): MarginTerminalPosition | undefined {
  return history
    .filter((row) => isRowForPlan({ row, plan }))
    .reduce<MarginTerminalPosition | undefined>(
      (latest, row) => (!latest || Number(row.closedAt) > Number(latest.closedAt) ? row : latest),
      undefined,
    )
}

// Leverage the plan actually opened at, from the position it created. The live form store is not it:
// a retry-open sizes at a fixed 2x, and the user can move the slider between creating the plan and
// its completion.
export function findOpenedLeverageForPlan({
  plan,
  positions,
}: {
  plan: MarginPlanResponse
  positions: MarginActivePosition[]
}): number | undefined {
  const opened = positions.find((row) => isRowForPlan({ row, plan }))
  return opened === undefined ? undefined : marginOpenedLeverage(opened)
}

// Add margin / Withdraw margin / Change leverage all ride the ADJUST intent, so the plan alone cannot
// name what the user did — the originating action comes off the execution store. Absent (plan resumed
// after a reload) falls back to the generic sentence.
function adjustCompletionMessage({ action, t }: { action?: MarginManageAction; t: TFunction }): string {
  switch (action) {
    case 'add':
      return t('margin.toast.marginAdded')
    case 'withdraw':
      return t('margin.toast.marginWithdrawn')
    case 'leverage':
      return t('margin.toast.leverageUpdated')
    default:
      return t('margin.toast.positionAdjusted')
  }
}

// Best-effort per-intent toast copy; sizing values read from the completed plan's steps
// and the (freshly-invalidated) positions data — absent values render as an em dash.
export function buildCompletionToastMessage({
  plan,
  history,
  action,
  leverage,
  t,
  formatNumberOrString,
  resolveMarket,
  currencyInfos,
}: {
  plan: MarginPlanResponse
  history: MarginTerminalPosition[]
  action?: MarginManageAction
  // OPEN only — the leverage the plan actually opened at (findOpenedLeverageForPlan).
  leverage: number
  t: TFunction
  formatNumberOrString: FormatNumberOrString
  resolveMarket: MarginMarketResolver
  currencyInfos: Map<string, CurrencyInfo>
}): string {
  const market = resolveMarket(plan)
  switch (plan.intent) {
    case 'OPEN': {
      const openStep = plan.steps.find((step) => step.stepType === 'MARGIN_OPEN')
      const size =
        market && openStep?.tokenOutAmount
          ? `${formatNumberOrString({
              value: rawToNumber({ raw: openStep.tokenOutAmount, decimals: market.collateral.decimals }),
              type: NumberType.TokenNonTx,
            })} ${market.displaySymbol}`
          : (market?.displaySymbol ??
            marginFallbackPairLabel({
              collateralToken: plan.collateralToken,
              debtToken: plan.debtToken,
              currencyInfos,
            }))
      const direction = marginMarketDirection({ collateralToken: plan.collateralToken, debtToken: plan.debtToken })
      return direction === 'SHORT'
        ? t('margin.toast.openedShort', { size, leverage: formatLeverage(leverage) })
        : t('margin.toast.openedLong', { size, leverage: formatLeverage(leverage) })
    }
    case 'CLOSE': {
      const closed = findLatestCloseForPlan({ plan, history })
      // The same USD realized figure the history row shows, so the toast and the row agree.
      const pnlValue =
        market && closed?.realizedPnlUsd !== undefined && closed.isTradable !== false
          ? marginRawUsdToNumber({
              raw: closed.realizedPnlUsd,
              market,
              direction: closed.direction,
            })
          : undefined
      const pnl =
        pnlValue !== undefined
          ? formatSignedFiat({
              value: pnlValue,
              format: (value) => formatNumberOrString({ value, type: NumberType.FiatStandard }),
            })
          : '—'
      return t('margin.toast.closed', { pnl })
    }
    case 'ADJUST':
      return adjustCompletionMessage({ action, t })
    default:
      return t('margin.toast.reduced')
  }
}
