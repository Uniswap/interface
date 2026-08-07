import { renderHook } from '@testing-library/react-native'
import { TradingApi } from '@universe/api'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { TransactionAndPlanStep } from 'uniswap/src/features/transactions/swap/plan/planStepTransformer'
import { useActivePlanStatus } from 'uniswap/src/features/transactions/swap/review/hooks/useActivePlanStatus'
import {
  ActivePlanData,
  activePlanStore,
} from 'uniswap/src/features/transactions/swap/review/stores/activePlan/activePlanStore'
import { beforeEach, describe, expect, it } from 'vitest'

const { COMPLETE, STEP_ERROR, AWAITING_ACTION } = TradingApi.PlanStepStatus

function createStep(status: TradingApi.PlanStepStatus): TransactionAndPlanStep {
  return { status } as TransactionAndPlanStep
}

function setActivePlan(steps: TransactionAndPlanStep[]): void {
  const plan: ActivePlanData = {
    response: {} as ActivePlanData['response'],
    planId: 'plan-A',
    inputChainId: UniverseChainId.Mainnet,
    steps,
    proofPending: false,
    currentStepIndex: 0,
  }
  activePlanStore.setState({ activePlan: plan })
}

describe(useActivePlanStatus, () => {
  beforeEach(() => {
    activePlanStore.setState({ activePlan: undefined })
  })

  it('reports no active plan', () => {
    const { result } = renderHook(useActivePlanStatus)

    expect(result.current).toEqual({ hasActivePlan: false, lastStepFailed: false })
  })

  it('reports failure for the latest unrecovered STEP_ERROR row', () => {
    setActivePlan([createStep(COMPLETE), createStep(STEP_ERROR), createStep(AWAITING_ACTION)])

    const { result } = renderHook(useActivePlanStatus)

    expect(result.current).toEqual({ hasActivePlan: true, lastStepFailed: true })
  })

  it('does not report failures recovered by a later COMPLETE row', () => {
    setActivePlan([createStep(STEP_ERROR), createStep(COMPLETE), createStep(AWAITING_ACTION)])

    const { result } = renderHook(useActivePlanStatus)

    expect(result.current).toEqual({ hasActivePlan: true, lastStepFailed: false })
  })

  it('reports failure when every row is a failed attempt (terminal case)', () => {
    setActivePlan([createStep(STEP_ERROR), createStep(STEP_ERROR)])

    const { result } = renderHook(useActivePlanStatus)

    expect(result.current).toEqual({ hasActivePlan: true, lastStepFailed: true })
  })

  it('reports no failure on the happy path', () => {
    setActivePlan([createStep(COMPLETE), createStep(AWAITING_ACTION)])

    const { result } = renderHook(useActivePlanStatus)

    expect(result.current).toEqual({ hasActivePlan: true, lastStepFailed: false })
  })
})
