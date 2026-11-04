import { normalizeTokenAddressForCache } from '@universe/chains'
import type { TFunction } from 'i18next'
import type {
  MarginActivePosition,
  MarginPlanIntent,
  MarginPlanResponse,
} from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { marginPositionSubId, marginPositionTokens } from '~/features/margin/utils/marginPositionRow'
import { isTerminalPlanStatus } from '~/pages/Swap/Margin/hooks/marginExecutionGuards'

export type MarginTableRow =
  | { kind: 'position'; position: MarginActivePosition }
  | { kind: 'drawer'; position: MarginActivePosition }
  | { kind: 'inFlight'; intent: MarginPlanIntent; planId: string; stepLabel: string }

// Active-tab row assembly around the execution store's plan:
// - OPEN plans never get an in-flight row — the steps modal (while open) and the Open CTA's resume
//   (once closed) own that surface.
// - Non-OPEN plans get the in-flight row only while the modal is closed; open, the modal is the
//   progress surface and the row would duplicate it.
// - Server rows matching the OPEN plan are suppressed while the modal shows it or the executor
//   drives it: a 20s poll landing between the open tx mining and the PATCH finalize otherwise
//   double-shows the position row alongside the modal or card. Parked with the modal closed, the
//   server surfaces take over. Gate on isExecuting, never executingPlanId — create-driven runs hold
//   the lock as 'PENDING_CREATE', so planId equality would never match.
export function buildMarginActiveRows({
  positions,
  plan,
  isModalOpen,
  isExecuting,
  t,
}: {
  positions?: MarginActivePosition[]
  plan?: MarginPlanResponse
  isModalOpen: boolean
  isExecuting: boolean
  t: TFunction
}): MarginTableRow[] {
  const rows: MarginTableRow[] = []
  const isPlanInFlight = plan !== undefined && !isTerminalPlanStatus(plan.status)

  if (plan && isPlanInFlight && plan.intent !== 'OPEN' && !isModalOpen) {
    const completedCount = plan.steps.filter((step) => step.status === 'COMPLETE').length
    rows.push({
      kind: 'inFlight',
      intent: plan.intent,
      planId: plan.planId,
      stepLabel: t('margin.table.stepProgress', {
        current: Math.min(completedCount + 1, plan.steps.length),
        total: plan.steps.length,
      }),
    })
  }

  const suppressServerRow = (row: { subId?: string; collateralToken: string; debtToken: string }): boolean =>
    Boolean(
      plan &&
      isPlanInFlight &&
      plan.intent === 'OPEN' &&
      (isModalOpen || isExecuting) &&
      row.subId === plan.subId &&
      normalizeTokenAddressForCache(row.collateralToken) === normalizeTokenAddressForCache(plan.collateralToken) &&
      normalizeTokenAddressForCache(row.debtToken) === normalizeTokenAddressForCache(plan.debtToken),
    )

  for (const position of positions ?? []) {
    if (!suppressServerRow({ subId: marginPositionSubId(position), ...marginPositionTokens(position) })) {
      rows.push({ kind: 'position', position })
    }
  }
  return rows
}
