import { TradingApi } from '@universe/api'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  isEarnActivePlanExecuting,
  isEarnPlanPriceChangeInterrupted,
  useEarnPlanProgressState,
} from 'uniswap/src/features/earn/EarnPlanProgressIndicator'
import { TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import type { TransactionAndPlanStep } from 'uniswap/src/features/transactions/swap/plan/planStepTransformer'
import type { ActivePlanData } from 'uniswap/src/features/transactions/swap/review/stores/activePlan/activePlanStore'
import { activePlanStore } from 'uniswap/src/features/transactions/swap/review/stores/activePlan/activePlanStore'
import { renderHookWithProviders } from 'uniswap/src/test/render'

const PLAN_ID = 'earn-plan'

function createPlanStep(overrides: Partial<TransactionAndPlanStep> = {}): TransactionAndPlanStep {
  return {
    stepIndex: 0,
    stepType: TradingApi.PlanStepType.VAULT_DEPOSIT,
    status: TradingApi.PlanStepStatus.AWAITING_ACTION,
    method: TradingApi.PlanStepMethod.SEND_TX,
    payload: {},
    tokenInChainId: UniverseChainId.Mainnet as unknown as TradingApi.ChainId,
    tokenOutChainId: UniverseChainId.Mainnet as unknown as TradingApi.ChainId,
    tokenIn: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    tokenOut: '0x8c106EEDAd96553e64287A5A6839c3Cc78afA3D0',
    tokenInAmount: '1000000',
    tokenOutAmount: '1000000',
    slippage: 0.5,
    type: TransactionStepType.SwapTransaction,
    txRequest: {
      to: '0x8c106EEDAd96553e64287A5A6839c3Cc78afA3D0',
      chainId: UniverseChainId.Mainnet,
      data: '0x',
      value: '0',
    },
    ...overrides,
  } as TransactionAndPlanStep
}

function createActivePlan({
  planId = PLAN_ID,
  proofPending = false,
  steps = [createPlanStep()],
  currentStepIndex = 0,
}: {
  planId?: string
  proofPending?: boolean
  steps?: TransactionAndPlanStep[]
  currentStepIndex?: number
} = {}): ActivePlanData {
  return {
    response: {} as ActivePlanData['response'],
    planId,
    inputChainId: UniverseChainId.Mainnet,
    steps,
    proofPending,
    currentStepIndex,
  }
}

function resetActivePlanStore(): void {
  activePlanStore.setState({
    activePlan: undefined,
    backgroundedPlans: {},
    cancelledPlanIds: new Set(),
    priceChangeInterruptedPlanIds: new Set(),
    executionLockPlanId: null,
    pendingRefreshPromise: null,
  })
}

describe('useEarnPlanProgressState', () => {
  beforeEach(resetActivePlanStore)
  afterEach(resetActivePlanStore)

  it('returns progress for a single-step Earn plan', () => {
    const step = createPlanStep()
    activePlanStore.getState().actions.setActivePlan(createActivePlan({ proofPending: true, steps: [step] }))

    const { result, unmount } = renderHookWithProviders(useEarnPlanProgressState)

    expect(result.current?.steps).toEqual([step])
    expect(result.current?.currentStep).toEqual({
      step,
      accepted: true,
    })
    unmount()
  })

  it('does not return progress for a single-step non-Earn plan', () => {
    activePlanStore.getState().actions.setActivePlan(
      createActivePlan({
        steps: [createPlanStep({ stepType: TradingApi.PlanStepType.CLASSIC })],
      }),
    )

    const { result, unmount } = renderHookWithProviders(useEarnPlanProgressState)

    expect(result.current).toBeUndefined()
    unmount()
  })

  it('does not return progress for a backgrounded Earn plan', () => {
    activePlanStore.getState().actions.setActivePlan(createActivePlan())
    activePlanStore.getState().actions.backgroundPlan(PLAN_ID)

    const { result, unmount } = renderHookWithProviders(useEarnPlanProgressState)

    expect(result.current).toBeUndefined()
    unmount()
  })

  it('does not return progress for a price-change-interrupted Earn plan', () => {
    activePlanStore.getState().actions.setActivePlan(createActivePlan())
    activePlanStore.getState().actions.markPlanPriceChangeInterrupted(PLAN_ID)

    const { result, unmount } = renderHookWithProviders(useEarnPlanProgressState)

    expect(result.current).toBeUndefined()
    unmount()
  })

  it('keeps the errored previous Earn step visible while the next step is current', () => {
    const erroredStep = createPlanStep({
      stepIndex: 0,
      status: TradingApi.PlanStepStatus.STEP_ERROR,
    })
    const nextStep = createPlanStep({
      stepIndex: 1,
      stepType: TradingApi.PlanStepType.VAULT_DEPOSIT,
      status: TradingApi.PlanStepStatus.AWAITING_ACTION,
    })
    activePlanStore
      .getState()
      .actions.setActivePlan(
        createActivePlan({ proofPending: true, steps: [erroredStep, nextStep], currentStepIndex: 1 }),
      )

    const { result, unmount } = renderHookWithProviders(useEarnPlanProgressState)

    expect(result.current?.steps).toEqual([erroredStep, nextStep])
    expect(result.current?.currentStep).toEqual({
      step: erroredStep,
      accepted: false,
    })
    unmount()
  })
})

describe('Earn active plan execution helpers', () => {
  it('treats a retained price-change-interrupted plan as resumable rather than executing', () => {
    const activePlan = createActivePlan()
    const priceChangeInterruptedPlanIds = new Set([PLAN_ID])

    expect(isEarnPlanPriceChangeInterrupted({ activePlan, priceChangeInterruptedPlanIds })).toBe(true)
    expect(isEarnActivePlanExecuting({ activePlan, priceChangeInterruptedPlanIds })).toBe(false)
  })

  it('treats a normal active plan as executing', () => {
    const activePlan = createActivePlan()

    expect(isEarnPlanPriceChangeInterrupted({ activePlan, priceChangeInterruptedPlanIds: new Set() })).toBe(false)
    expect(isEarnActivePlanExecuting({ activePlan, priceChangeInterruptedPlanIds: new Set() })).toBe(true)
  })
})
