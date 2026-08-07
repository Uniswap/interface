import { act, renderHook } from '@testing-library/react'
import { TradingApi } from '@universe/api'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  resetStoppedEarnPlan,
  useEarnReviewExecutionHandlers,
} from 'uniswap/src/features/earn/hooks/useEarnReviewExecutionHandlers'
import type { ActivePlanData } from 'uniswap/src/features/transactions/swap/review/stores/activePlan/activePlanStore'
import { activePlanStore } from 'uniswap/src/features/transactions/swap/review/stores/activePlan/activePlanStore'

const mockResetActivePlan = vi.hoisted(() => vi.fn())

vi.mock('uniswap/src/features/transactions/swap/plan/planSagaUtils', () => ({
  resetActivePlan: mockResetActivePlan,
}))

const PLAN_ID = 'earn-plan'

function createPlan({ earnOwned = true }: { earnOwned?: boolean } = {}): ActivePlanData {
  return {
    response: {} as ActivePlanData['response'],
    planId: PLAN_ID,
    inputChainId: UniverseChainId.Mainnet,
    steps: [],
    proofPending: false,
    currentStepIndex: 1,
    earnReuseIdentity: earnOwned
      ? { action: TradingApi.EarnAction.DEPOSIT, vault: '0xvault', chainId: UniverseChainId.Mainnet }
      : undefined,
  }
}

function seedStore({
  activePlan,
  executionLockPlanId = null,
}: {
  activePlan: ActivePlanData | undefined
  executionLockPlanId?: string | null
}): void {
  activePlanStore.setState({
    activePlan,
    backgroundedPlans: {},
    cancelledPlanIds: new Set(),
    priceChangeInterruptedPlanIds: new Set(),
    executionLockPlanId,
    pendingRefreshPromise: null,
  })
}

function renderHandlers({
  onBack = vi.fn(),
  onClose = vi.fn(),
  onExecutionFailure,
}: {
  onBack?: () => void
  onClose?: () => void
  onExecutionFailure?: (error?: Error) => void
} = {}): { result: { current: ReturnType<typeof useEarnReviewExecutionHandlers> } } {
  return renderHook(() => useEarnReviewExecutionHandlers({ onBack, onClose, onExecutionFailure }))
}

beforeEach(() => {
  mockResetActivePlan.mockClear()
  seedStore({ activePlan: undefined })
})

describe(resetStoppedEarnPlan, () => {
  it('clears a stopped earn-owned plan when the execution lock is not held', () => {
    seedStore({ activePlan: createPlan() })
    resetStoppedEarnPlan()
    expect(mockResetActivePlan).toHaveBeenCalledTimes(1)

    seedStore({ activePlan: createPlan(), executionLockPlanId: 'other-plan' })
    resetStoppedEarnPlan()
    expect(mockResetActivePlan).toHaveBeenCalledTimes(2)
  })

  it('preserves an executing plan', () => {
    seedStore({ activePlan: createPlan(), executionLockPlanId: PLAN_ID })
    resetStoppedEarnPlan()
    expect(mockResetActivePlan).not.toHaveBeenCalled()
  })

  it('preserves a core swap plan', () => {
    seedStore({ activePlan: createPlan({ earnOwned: false }) })
    resetStoppedEarnPlan()
    expect(mockResetActivePlan).not.toHaveBeenCalled()
  })

  it('does nothing without a retained plan', () => {
    resetStoppedEarnPlan()
    expect(mockResetActivePlan).not.toHaveBeenCalled()
  })
})

describe(useEarnReviewExecutionHandlers, () => {
  it('clears a stopped retained plan on back so re-entry starts fresh', () => {
    seedStore({ activePlan: createPlan() })
    const onBack = vi.fn()
    const { result } = renderHandlers({ onBack })

    act(() => {
      result.current.handleBack()
    })

    expect(mockResetActivePlan).toHaveBeenCalledTimes(1)
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('clears a stopped retained plan on close', () => {
    seedStore({ activePlan: createPlan() })
    const onClose = vi.fn()
    const { result } = renderHandlers({ onClose })

    act(() => {
      result.current.handleClose()
    })

    expect(mockResetActivePlan).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('preserves the plan on back/close while it is executing', () => {
    seedStore({ activePlan: createPlan(), executionLockPlanId: PLAN_ID })
    const onBack = vi.fn()
    const onClose = vi.fn()
    const { result } = renderHandlers({ onBack, onClose })

    act(() => {
      result.current.handleBack()
      result.current.handleClose()
    })

    expect(mockResetActivePlan).not.toHaveBeenCalled()
    expect(onBack).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('stores the failure retry callback and replays it on retry', () => {
    const retry = vi.fn()
    const { result } = renderHandlers()

    act(() => {
      result.current.handleFailure(new Error('step failed'), retry)
    })
    expect(result.current.executionError?.message).toBe('step failed')
    expect(result.current.isSubmitting).toBe(false)

    act(() => {
      result.current.handleRetry()
    })
    expect(retry).toHaveBeenCalledTimes(1)
    expect(result.current.executionError).toBeUndefined()
    expect(result.current.isSubmitting).toBe(true)
  })

  it('keeps handled interruptions error-free so the review CTA can resume the plan', () => {
    const onExecutionFailure = vi.fn()
    const { result } = renderHandlers({ onExecutionFailure })

    act(() => {
      result.current.handleFailure(undefined, undefined)
    })

    expect(result.current.executionError).toBeUndefined()
    expect(result.current.isSubmitting).toBe(false)
    expect(onExecutionFailure).not.toHaveBeenCalled()
  })
})
