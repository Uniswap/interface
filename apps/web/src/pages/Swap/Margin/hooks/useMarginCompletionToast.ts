import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { MarginPlanStatus, MarginTerminalPosition } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { useMarginPositionsQuery } from 'uniswap/src/data/apiClients/tradingApi/useMarginPositionsQuery'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useMarginFormStore } from 'uniswap/src/features/transactions/margin/stores/marginFormStore/useMarginFormStore'
import { MARGIN_CHAIN_ID } from '~/constants/margin'
import { useMarginPlanExecution } from '~/pages/Swap/Margin/hooks/marginPlanExecutionStore'
import { useMarginCurrencyInfos } from '~/pages/Swap/Margin/hooks/useMarginCurrencyInfos'
import { useResolveMarginMarket } from '~/pages/Swap/Margin/hooks/useResolveMarginMarket'
import {
  buildCompletionToastMessage,
  findLatestCloseForPlan,
  findOpenedLeverageForPlan,
} from '~/pages/Swap/Margin/marginCompletionToast'
import { isMarginActivePosition } from '~/pages/Swap/Margin/marginPositionRow'
import { popupRegistry } from '~/state/popups/registry'
import { PopupType } from '~/state/popups/types'

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

  const { data } = useMarginPositionsQuery({
    params: plan ? { swapper: plan.swapper, chainId: MARGIN_CHAIN_ID } : undefined,
  })
  const positions = data?.positions
  const resolveMarket = useResolveMarginMarket({ positions })

  const prevPlanStatusRef = useRef<MarginPlanStatus | undefined>(undefined)
  useEffect(() => {
    const prevStatus = prevPlanStatusRef.current
    prevPlanStatusRef.current = plan?.status
    if (!plan || plan.status !== 'COMPLETED' || prevStatus === undefined || prevStatus === 'COMPLETED') {
      return
    }
    const history = (positions ?? []).filter(
      (position): position is MarginTerminalPosition => position.status !== 'ACTIVE',
    )
    const message = buildCompletionToastMessage({
      plan,
      history,
      action: lastManageAction,
      leverage:
        findOpenedLeverageForPlan({ plan, positions: (positions ?? []).filter(isMarginActivePosition) }) ??
        formLeverage,
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
  }, [plan, positions, lastManageAction, formLeverage, t, formatNumberOrString, resolveMarket, currencyInfos])
}
