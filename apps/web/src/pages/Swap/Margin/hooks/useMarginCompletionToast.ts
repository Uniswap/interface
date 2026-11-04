import { useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  MARGIN_ACTIVE_POSITION_STATUSES,
  MARGIN_TERMINAL_POSITION_STATUSES,
  type MarginPlanStatus,
} from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { useMarginPositionsQuery } from 'uniswap/src/data/apiClients/tradingApi/useMarginPositionsQuery'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useMarginFormStore } from 'uniswap/src/features/transactions/margin/stores/marginFormStore/useMarginFormStore'
import { MARGIN_CHAIN_ID } from '~/constants/margin'
import { useMarginCurrencyInfos } from '~/features/margin/hooks/useMarginCurrencyInfos'
import { useResolveMarginMarket } from '~/features/margin/hooks/useResolveMarginMarket'
import { isMarginActivePosition, isMarginTerminalPosition } from '~/features/margin/utils/marginPositionRow'
import { useMarginPlanExecution } from '~/pages/Swap/Margin/hooks/marginPlanExecutionStore'
import {
  buildCompletionToastMessage,
  findLatestCloseForPlan,
  findOpenedLeverageForPlan,
} from '~/pages/Swap/Margin/marginCompletionToast'
import { popupRegistry } from '~/utils/popups/registry'
import { PopupType } from '~/utils/popups/types'

/**
 * Success toast + close analytics on the execution store's transition to COMPLETED.
 *
 * Mounted beside the review modal rather than inside the positions table: the table renders only on
 * the terminal view (or as the wide-screen side panel), while the modal drives the loop for the whole
 * flag-on session — so a plan finishing its mining tail with the table off screen used to toast
 * nothing and drop `MarginPositionClosed` silently.
 *
 * The positions read is gated on a plan existing, so an ordinary swap page subscribes to nothing.
 */
export function useMarginCompletionToast(): void {
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()
  const currencyInfos = useMarginCurrencyInfos()
  const plan = useMarginPlanExecution((s) => s.plan)
  const lastManageAction = useMarginPlanExecution((s) => s.lastManageAction)
  const formLeverage = useMarginFormStore((s) => s.leverage)

  // The opened leverage reads the live row and a close's PnL reads the terminal one.
  const { data: activeData } = useMarginPositionsQuery({
    params: plan
      ? { swapper: plan.swapper, chainId: MARGIN_CHAIN_ID, statuses: MARGIN_ACTIVE_POSITION_STATUSES }
      : undefined,
  })
  const { data: terminalData } = useMarginPositionsQuery({
    params: plan
      ? { swapper: plan.swapper, chainId: MARGIN_CHAIN_ID, statuses: MARGIN_TERMINAL_POSITION_STATUSES }
      : undefined,
  })
  const activePositions = useMemo(() => activeData?.positions.filter(isMarginActivePosition) ?? [], [activeData])
  const history = useMemo(() => terminalData?.positions.filter(isMarginTerminalPosition) ?? [], [terminalData])
  const resolverPositions = useMemo(() => [...activePositions, ...history], [activePositions, history])
  const resolveMarket = useResolveMarginMarket({ positions: resolverPositions })

  const prevPlanStatusRef = useRef<MarginPlanStatus | undefined>(undefined)
  useEffect(() => {
    const prevStatus = prevPlanStatusRef.current
    prevPlanStatusRef.current = plan?.status
    if (!plan || plan.status !== 'COMPLETED' || prevStatus === undefined || prevStatus === 'COMPLETED') {
      return
    }
    const message = buildCompletionToastMessage({
      plan,
      history,
      action: lastManageAction,
      leverage: findOpenedLeverageForPlan({ plan, positions: activePositions }) ?? formLeverage,
      t,
      formatNumberOrString,
      resolveMarket,
      currencyInfos,
    })
    popupRegistry.addPopup({ type: PopupType.Success, message }, `margin-plan-completed-${plan.planId}`)
    if (plan.intent === 'CLOSE') {
      // Event first, PnL best-effort — the invalidated history row may not have landed yet.
      sendAnalyticsEvent(InterfaceEventName.MarginPositionClosed, {
        realizedPnl: findLatestCloseForPlan({ plan, history })?.realizedPnl,
      })
    }
  }, [
    plan,
    activePositions,
    history,
    lastManageAction,
    formLeverage,
    t,
    formatNumberOrString,
    resolveMarket,
    currencyInfos,
  ])
}
