import { useMemo } from 'react'
import type {
  MarginPendingPlan,
  MarginPlanIntent,
  MarginPlanStatus,
} from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { useMarginPositionsQuery } from 'uniswap/src/data/apiClients/tradingApi/useMarginPositionsQuery'
import { MARGIN_CHAIN_ID } from '~/constants/margin'
import { useAccount } from '~/hooks/useAccount'
import { isTerminalPlanStatus } from '~/pages/Swap/Margin/hooks/marginExecutionGuards'
import { useMarginPlanExecution } from '~/pages/Swap/Margin/hooks/marginPlanExecutionStore'

// The section sits above the positions table, so an account that accumulated many strands would push
// the user's actual positions off-screen. Cards are capped at the server's own leading order — the
// wire's createdAt is passed through verbatim with its format explicitly not assumed FE-side, so
// sorting on it here would be guesswork. Cancel is per-card and the banner resumes independently, so
// a hidden strand stays reachable after the ones above it clear.
export const MAX_PENDING_PLAN_CARDS = 5

// The steps modal owns the surface for the plan it is showing, so that plan's card is hidden while
// the modal is open — and ONLY then: the card must appear the moment the modal closes, even while
// the executor still drives the plan in the background. A store-TERMINAL plan's card is masked
// unconditionally: the cache can lag the server's terminal exclusion by up to one poll, and an
// actionable Resume/Cancel card for a dead plan must not flash. Deduped by planId (React keys off it,
// and two cards for one plan would offer the same Cancel twice) and capped, in that order — dropping
// duplicates first means the cap counts distinct plans, never repeats of one.
export function selectVisiblePendingPlans({
  pendingPlans,
  isModalOpen,
  storePlanId,
  storePlanIsTerminal,
}: {
  pendingPlans?: MarginPendingPlan[]
  isModalOpen: boolean
  storePlanId?: string
  storePlanIsTerminal: boolean
}): MarginPendingPlan[] {
  const seen = new Set<string>()
  const visible: MarginPendingPlan[] = []
  for (const plan of pendingPlans ?? []) {
    if (plan.planId === storePlanId && (isModalOpen || storePlanIsTerminal)) {
      continue
    }
    if (seen.has(plan.planId)) {
      continue
    }
    seen.add(plan.planId)
    visible.push(plan)
    if (visible.length === MAX_PENDING_PLAN_CARDS) {
      break
    }
  }
  return visible
}

// Cancel is a raw server call (not covered by the client's single-flight lock), so it gates
// separately: never while the executor drives the plan, and never while a locally-broadcast proof
// hasn't landed server-side. Resuming is what reconciles that hash — the executor re-PATCHes the
// persisted proof instead of re-broadcasting — and cancelling destroys the only record able to
// absorb it.
//
// This local check covers the window between broadcast and the PATCH, and only on THIS device — the
// proof cache is localStorage-backed. The server is not unguarded past that point: it recomputes
// `cancellable` from live in-progress proofs and cancelPlan itself refuses one. What does not exist is
// a background SWEEP reconciling a stranded proof, which is why the client still gates rather than
// leaving it to the server.
export function shouldOfferPendingCancel({
  cancellable,
  isExecutingThisPlan,
  hasUnlandedLocalProof,
}: {
  cancellable: boolean
  isExecutingThisPlan: boolean
  hasUnlandedLocalProof: boolean
}): boolean {
  return cancellable && !isExecutingThisPlan && !hasUnlandedLocalProof
}

// The banner offers to resume the local device's in-progress plan for ANY intent that left a
// persisted pointer — including OPEN. The pending section's cards no longer carry a Resume (a
// non-cancellable strand shows Cancel-disabled), so the banner is the resume affordance for a
// same-device open strand, backed by the local proof `resumePlan` replays. Cross-device open recovery
// has no local pointer and relies on server-side reconciliation, not this banner.
//
// Hidden only while something ELSE owns that surface: the steps modal while it is up, and the
// executor while it is still driving. Deliberately NOT hidden merely because the execution store
// holds a plan — a PARKED plan (modal closed at an AWAITING_ACTION step) stays in the store, and
// that is precisely the state with no other way forward: an OPEN plan gets no in-flight row, and the
// pending card carries only Cancel.
export function shouldShowPointerBanner({
  pointer,
  storePlan,
  isModalOpen,
  isExecuting,
}: {
  pointer: { planId: string; intent: MarginPlanIntent } | undefined
  // The execution store's plan, when it is the one the pointer names. The pointer is cleared on every
  // terminal path (`clearPointerIfOwned`, and the cancel mutation), so this is a second line rather than
  // the only one — but a pointer that outlives its plan would otherwise offer "Resume" with a live
  // Continue on a plan that is already done, and the banner should not depend on a write in another
  // module to know that. `selectVisiblePendingPlans` masks store-terminal plans for the same reason.
  storePlan: { planId: string; status: MarginPlanStatus } | undefined
  isModalOpen: boolean
  isExecuting: boolean
}): boolean {
  if (pointer === undefined || isModalOpen || isExecuting) {
    return false
  }
  return !(storePlan?.planId === pointer.planId && isTerminalPlanStatus(storePlan.status))
}

// Stranded OPEN plans to surface in the pending section. Reads the shared positions cache entry;
// polling is owned by MarginPositionsTable's observer on the same key (the section mounts inside it).
export function useMarginPendingPlans(): MarginPendingPlan[] {
  const account = useAccount()
  const { data } = useMarginPositionsQuery({
    params: account.address ? { swapper: account.address, chainId: MARGIN_CHAIN_ID } : undefined,
  })
  const isModalOpen = useMarginPlanExecution((s) => s.isModalOpen)
  const storePlanId = useMarginPlanExecution((s) => s.plan?.planId)
  const storePlanIsTerminal = useMarginPlanExecution((s) => s.plan !== undefined && isTerminalPlanStatus(s.plan.status))

  return useMemo(
    () =>
      selectVisiblePendingPlans({ pendingPlans: data?.pendingPlans, isModalOpen, storePlanId, storePlanIsTerminal }),
    [data?.pendingPlans, isModalOpen, storePlanId, storePlanIsTerminal],
  )
}
