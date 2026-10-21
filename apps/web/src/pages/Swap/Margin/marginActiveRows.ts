import { normalizeTokenAddressForCache } from '@universe/chains'
import type { TFunction } from 'i18next'
import type {
  MarginActivePosition,
  MarginPlanIntent,
  MarginPlanResponse,
  MarginPosition,
} from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import type { MarginDirection } from 'uniswap/src/features/transactions/margin/types'
import { isTerminalPlanStatus } from '~/pages/Swap/Margin/hooks/marginExecutionGuards'
import { accruedUsd, rawToNumber, scaledE18ToNumber } from '~/pages/Swap/Margin/marginFormat'
import {
  hasMarginOpenedAt,
  isMarginActivePosition,
  marginPositionSubId,
  marginPositionTokens,
} from '~/pages/Swap/Margin/marginPositionRow'

export type MarginTableRow =
  | { kind: 'position'; position: MarginActivePosition }
  | { kind: 'drawer'; position: MarginActivePosition }
  | { kind: 'inFlight'; intent: MarginPlanIntent; planId: string; stepLabel: string }

// Active-tab row assembly around the execution store's plan:
// - OPEN plans never get an in-flight row — the steps modal (while open) and the pending-section
//   card (once closed) own that surface.
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
  positions?: MarginPosition[]
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

  // positions[] now carries terminal rows too (status !== 'ACTIVE') — the active tab only ever shows
  // the live ones.
  for (const position of positions ?? []) {
    if (!isMarginActivePosition(position)) {
      continue
    }
    if (!suppressServerRow({ subId: marginPositionSubId(position), ...marginPositionTokens(position) })) {
      rows.push({ kind: 'position', position })
    }
  }
  return rows
}

const SECONDS_PER_DAY = 86_400

/**
 * Interest accrued so far, and the daily rate it implies in USD — or undefined where the figure would
 * be a guess.
 *
 * The rate is accrued ÷ age, so it needs a real `openedAt` — `hasMarginOpenedAt`, deliberately NOT
 * `hasMarginPositionBasis`: that one additionally demands an entry price and gates figures priced at
 * the at-open MARK, which this rate is not, so coupling them would drop a sound accrual over a missing
 * entry price. `accruedInterest` is denominated in the DEBT token — the volatile leg for a short — so
 * it is valued before it can reach a fiat formatter. `nowMs` is injected rather than read here so the
 * derivation is pinnable.
 */
export function marginAccruedInterestPerDay({
  position,
  debtDecimals,
  direction,
  nowMs,
}: {
  position: MarginActivePosition
  debtDecimals: number
  direction: MarginDirection | undefined
  nowMs: number
}): { accrued: number; perDayUsd: number } | undefined {
  if (position.accruedInterest === undefined || !hasMarginOpenedAt(position)) {
    return undefined
  }
  const accrued = rawToNumber({ raw: position.accruedInterest, decimals: debtDecimals })
  const ageDays = Math.max(0, Math.floor(nowMs / 1000) - Number(position.openedAt)) / SECONDS_PER_DAY
  // A position opened this instant has no age to divide by; report the whole accrual as the day's rate
  // rather than dividing by zero.
  const perDay = ageDays > 0 ? accrued / ageDays : accrued
  return {
    accrued,
    perDayUsd: accruedUsd({ accrued: perDay, direction, mark: scaledE18ToNumber(position.oraclePrice) }),
  }
}
