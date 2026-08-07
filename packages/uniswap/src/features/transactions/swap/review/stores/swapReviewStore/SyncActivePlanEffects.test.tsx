import { act, render } from '@testing-library/react-native'
import { TradingApi } from '@universe/api'
import type { PropsWithChildren } from 'react'
import type { Dispatch } from 'redux'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import type { TransactionAndPlanStep } from 'uniswap/src/features/transactions/swap/plan/planStepTransformer'
import {
  ActivePlanData,
  activePlanStore,
} from 'uniswap/src/features/transactions/swap/review/stores/activePlan/activePlanStore'
import { createSwapReviewStore } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewStore/createSwapReviewStore'
import { SwapReviewStoreContext } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewStore/SwapReviewContext'
import { SyncActivePlanEffects } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewStore/SyncActivePlanEffects'
import { createSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/createSwapFormStore'
import { SwapFormStoreContext } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/SwapFormStoreContext'
import type { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { beforeEach, describe, expect, it } from 'vitest'

const { COMPLETE, STEP_ERROR, AWAITING_ACTION } = TradingApi.PlanStepStatus

function createPlanStep(overrides: Partial<TransactionAndPlanStep> = {}): TransactionAndPlanStep {
  return {
    stepIndex: 0,
    stepType: TradingApi.PlanStepType.CLASSIC,
    status: AWAITING_ACTION,
    method: TradingApi.PlanStepMethod.SEND_TX,
    payload: {},
    routingStepKey: 'SWAP:0xUsdc:42161:0xWbtc:42161',
    type: TransactionStepType.SwapTransaction,
    ...overrides,
  } as TransactionAndPlanStep
}

function setActivePlan({
  steps,
  currentStepIndex,
}: {
  steps: TransactionAndPlanStep[]
  currentStepIndex: number
}): void {
  const plan: ActivePlanData = {
    response: {} as ActivePlanData['response'],
    planId: 'plan-A',
    inputChainId: UniverseChainId.Mainnet,
    steps,
    proofPending: false,
    currentStepIndex,
  }
  activePlanStore.setState({ activePlan: plan })
}

// Mounts the real effect with real Zustand stores through the raw Context.Providers, bypassing
// the heavy SwapFormStoreContextProvider — the effect only reads `isSubmitting` from that store.
function createWrapper(): {
  Wrapper: (props: PropsWithChildren<unknown>) => JSX.Element
  swapReviewStore: ReturnType<typeof createSwapReviewStore>
  swapFormStore: ReturnType<typeof createSwapFormStore>['store']
} {
  const swapReviewStore = createSwapReviewStore({ hideContent: false })
  const { store: swapFormStore } = createSwapFormStore({
    derivedSwapInfo: {} as DerivedSwapInfo,
    dependenciesForSideEffect: { dispatch: ((action) => action) as Dispatch },
  })

  function Wrapper({ children }: PropsWithChildren<unknown>): JSX.Element {
    return (
      <SwapFormStoreContext.Provider value={swapFormStore}>
        <SwapReviewStoreContext.Provider value={swapReviewStore}>{children}</SwapReviewStoreContext.Provider>
      </SwapFormStoreContext.Provider>
    )
  }

  return { Wrapper, swapReviewStore, swapFormStore }
}

describe(SyncActivePlanEffects, () => {
  beforeEach(() => {
    activePlanStore.setState({ activePlan: undefined })
  })

  it('writes the collapsed steps and a display step within them to the swap review store', () => {
    const bridge = createPlanStep({
      status: COMPLETE,
      stepIndex: 0,
      routingStepKey: 'BRIDGE:0xEth:1:0xEth:42161',
      type: TransactionStepType.SwapTransaction,
    })
    const olderFailure = createPlanStep({ status: STEP_ERROR, stepIndex: 1 })
    const latestFailure = createPlanStep({ status: STEP_ERROR, stepIndex: 2 })
    const regenerated = createPlanStep({ status: AWAITING_ACTION, stepIndex: 3 })
    setActivePlan({ steps: [bridge, olderFailure, latestFailure, regenerated], currentStepIndex: 3 })

    const { Wrapper, swapReviewStore } = createWrapper()
    render(<SyncActivePlanEffects />, { wrapper: Wrapper })

    // Retry duplicates are collapsed: the latest failed attempt stands in for the logical step.
    expect(swapReviewStore.getState().steps).toEqual([bridge, latestFailure])
    expect(swapReviewStore.getState().currentStep).toEqual({ step: latestFailure, accepted: false })
    expect(swapReviewStore.getState().steps).toContain(swapReviewStore.getState().currentStep?.step)
  })

  it('shows the live regenerated row while a retry is submitting', () => {
    const failed = createPlanStep({ status: STEP_ERROR, stepIndex: 0 })
    const regenerated = createPlanStep({ status: AWAITING_ACTION, stepIndex: 1 })
    setActivePlan({ steps: [failed, regenerated], currentStepIndex: 1 })

    const { Wrapper, swapReviewStore, swapFormStore } = createWrapper()
    act(() => {
      swapFormStore.setState({ isSubmitting: true })
    })
    render(<SyncActivePlanEffects />, { wrapper: Wrapper })

    expect(swapReviewStore.getState().steps).toEqual([regenerated])
    expect(swapReviewStore.getState().currentStep).toEqual({ step: regenerated, accepted: false })
  })
})
