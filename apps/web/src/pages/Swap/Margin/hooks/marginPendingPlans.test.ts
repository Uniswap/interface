import type { MarginPendingPlan } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { describe, expect, it } from 'vitest'
import {
  MAX_PENDING_PLAN_CARDS,
  selectVisiblePendingPlans,
  shouldOfferPendingCancel,
  shouldShowPointerBanner,
} from '~/pages/Swap/Margin/hooks/marginPendingPlans'

function makePending(planId: string): MarginPendingPlan {
  return {
    planId,
    marketKey: 'k',
    collateralToken: '0xcollateral',
    debtToken: '0xdebt',
    currentStep: 0,
    stepCount: 3,
    cancellable: true,
  }
}

describe('selectVisiblePendingPlans', () => {
  it('returns an empty list when there are no pending plans', () => {
    expect(
      selectVisiblePendingPlans({
        pendingPlans: undefined,
        isModalOpen: false,
        storePlanId: undefined,
        storePlanIsTerminal: false,
      }),
    ).toEqual([])
  })

  it('passes every plan through when the store is idle', () => {
    const plans = [makePending('a'), makePending('b')]
    expect(
      selectVisiblePendingPlans({
        pendingPlans: plans,
        isModalOpen: false,
        storePlanId: undefined,
        storePlanIsTerminal: false,
      }),
    ).toEqual(plans)
  })

  it("hides the modal's own plan while the steps modal is open, leaving other plans visible", () => {
    const plans = [makePending('a'), makePending('b')]
    expect(
      selectVisiblePendingPlans({
        pendingPlans: plans,
        isModalOpen: true,
        storePlanId: 'a',
        storePlanIsTerminal: false,
      }),
    ).toEqual([makePending('b')])
  })

  it('shows the plan the moment the modal closes, even while the executor still drives it', () => {
    const plans = [makePending('a')]
    expect(
      selectVisiblePendingPlans({
        pendingPlans: plans,
        isModalOpen: false,
        storePlanId: 'a',
        storePlanIsTerminal: false,
      }),
    ).toEqual(plans)
  })

  it('masks a store-terminal plan regardless of modal state (cache lags the server terminal exclusion)', () => {
    const plans = [makePending('a'), makePending('b')]
    expect(
      selectVisiblePendingPlans({
        pendingPlans: plans,
        isModalOpen: false,
        storePlanId: 'a',
        storePlanIsTerminal: true,
      }),
    ).toEqual([makePending('b')])
  })

  it('never hides plans other than the store plan while the modal is open', () => {
    const plans = [makePending('b')]
    expect(
      selectVisiblePendingPlans({
        pendingPlans: plans,
        isModalOpen: true,
        storePlanId: 'a',
        storePlanIsTerminal: false,
      }),
    ).toEqual(plans)
  })

  // The section sits above the positions table, so an unbounded strand list would push the user's
  // actual positions off-screen.
  it('caps the cards at MAX_PENDING_PLAN_CARDS, keeping the server order', () => {
    const plans = Array.from({ length: MAX_PENDING_PLAN_CARDS + 3 }, (_, i) => makePending(`p${i}`))
    const visible = selectVisiblePendingPlans({
      pendingPlans: plans,
      isModalOpen: false,
      storePlanId: undefined,
      storePlanIsTerminal: false,
    })
    expect(visible).toEqual(plans.slice(0, MAX_PENDING_PLAN_CARDS))
  })

  // React keys off planId, and two cards for one plan would offer the same Cancel twice.
  it('drops duplicate planIds, keeping the first occurrence', () => {
    const visible = selectVisiblePendingPlans({
      pendingPlans: [makePending('a'), makePending('b'), makePending('a')],
      isModalOpen: false,
      storePlanId: undefined,
      storePlanIsTerminal: false,
    })
    expect(visible.map((p) => p.planId)).toEqual(['a', 'b'])
  })

  // Dedup runs BEFORE the cap, so the cap counts distinct plans rather than repeats of one — a
  // duplicate-heavy response must not squeeze real strands out of the list.
  it('counts the cap in distinct plans, not raw rows', () => {
    const duplicated = Array.from({ length: MAX_PENDING_PLAN_CARDS + 3 }, () => makePending('same'))
    const visible = selectVisiblePendingPlans({
      pendingPlans: [...duplicated, makePending('other')],
      isModalOpen: false,
      storePlanId: undefined,
      storePlanIsTerminal: false,
    })
    expect(visible.map((p) => p.planId)).toEqual(['same', 'other'])
  })

  // A hidden (modal-owned) plan must not consume a card slot.
  it('never spends a cap slot on a plan it filtered out', () => {
    const plans = [makePending('a'), ...Array.from({ length: MAX_PENDING_PLAN_CARDS }, (_, i) => makePending(`p${i}`))]
    const visible = selectVisiblePendingPlans({
      pendingPlans: plans,
      isModalOpen: true,
      storePlanId: 'a',
      storePlanIsTerminal: false,
    })
    expect(visible).toHaveLength(MAX_PENDING_PLAN_CARDS)
    expect(visible.map((p) => p.planId)).not.toContain('a')
  })
})

describe('shouldOfferPendingCancel', () => {
  it('offers Cancel for a parked, server-cancellable plan', () => {
    expect(
      shouldOfferPendingCancel({ cancellable: true, isExecutingThisPlan: false, hasUnlandedLocalProof: false }),
    ).toBe(true)
  })

  it('never offers Cancel while the executor drives the plan (server cancellable is up to 20s stale)', () => {
    expect(
      shouldOfferPendingCancel({ cancellable: true, isExecutingThisPlan: true, hasUnlandedLocalProof: false }),
    ).toBe(false)
  })

  it('never offers Cancel while a locally-broadcast proof has not landed server-side', () => {
    expect(
      shouldOfferPendingCancel({ cancellable: true, isExecutingThisPlan: false, hasUnlandedLocalProof: true }),
    ).toBe(false)
  })

  it('respects the server-side cancellable=false', () => {
    expect(
      shouldOfferPendingCancel({ cancellable: false, isExecutingThisPlan: false, hasUnlandedLocalProof: false }),
    ).toBe(false)
  })
})

describe('shouldShowPointerBanner', () => {
  const IDLE = { isModalOpen: false, isExecuting: false, storePlan: undefined }

  it('returns false when there is no persisted pointer', () => {
    expect(shouldShowPointerBanner({ pointer: undefined, ...IDLE })).toBe(false)
  })

  // The banner is the resume affordance for a same-device open strand — the pending card no longer
  // carries a Resume, so suppressing the banner for OPEN would strand a non-cancellable open.
  it('returns true for an OPEN pointer (the banner is its resume path)', () => {
    expect(shouldShowPointerBanner({ pointer: { planId: 'p1', intent: 'OPEN' }, ...IDLE })).toBe(true)
  })

  it('returns true for a CLOSE pointer', () => {
    expect(shouldShowPointerBanner({ pointer: { planId: 'p1', intent: 'CLOSE' }, ...IDLE })).toBe(true)
  })

  it('returns true for an ADJUST pointer', () => {
    expect(shouldShowPointerBanner({ pointer: { planId: 'p1', intent: 'ADJUST' }, ...IDLE })).toBe(true)
  })

  it.each([
    ['the steps modal is up', { isModalOpen: true, isExecuting: false }],
    ['the executor is still driving', { isModalOpen: false, isExecuting: true }],
  ])('hides while %s owns the surface', (_label, state) => {
    expect(shouldShowPointerBanner({ pointer: { planId: 'p1', intent: 'OPEN' }, storePlan: undefined, ...state })).toBe(
      false,
    )
  })

  // The state the gate exists for. A PARKED plan — modal closed at an AWAITING_ACTION step — stays in
  // the execution store, and gating on "no plan in the store" hid the banner exactly there. An OPEN
  // plan gets no in-flight row and its pending card carries only Cancel, so a reload was the only way
  // to get the funds already converted by a completed pre-swap back into a position.
  it('shows for a plan parked in the store with the modal closed and nothing executing', () => {
    expect(shouldShowPointerBanner({ pointer: { planId: 'p1', intent: 'OPEN' }, ...IDLE })).toBe(true)
  })

  // The pointer is cleared on every terminal path, so this is a second line rather than the only one —
  // but a pointer outliving its plan would otherwise offer "Resume incomplete open" with a live
  // Continue on a plan that is already finished.
  it.each(['COMPLETED', 'FAILED', 'CANCELLED'] as const)('hides on a store-terminal plan (%s)', (status) => {
    expect(
      shouldShowPointerBanner({
        pointer: { planId: 'p1', intent: 'OPEN' },
        ...IDLE,
        storePlan: { planId: 'p1', status },
      }),
    ).toBe(false)
  })

  it('still shows while the pointed-at plan is non-terminal', () => {
    expect(
      shouldShowPointerBanner({
        pointer: { planId: 'p1', intent: 'OPEN' },
        ...IDLE,
        storePlan: { planId: 'p1', status: 'AWAITING_ACTION' },
      }),
    ).toBe(true)
  })

  // One slot per swapper, so a terminal plan the pointer does NOT name must not suppress the banner.
  it('ignores a terminal plan the pointer does not name', () => {
    expect(
      shouldShowPointerBanner({
        pointer: { planId: 'p1', intent: 'OPEN' },
        ...IDLE,
        storePlan: { planId: 'other', status: 'COMPLETED' },
      }),
    ).toBe(true)
  })
})
