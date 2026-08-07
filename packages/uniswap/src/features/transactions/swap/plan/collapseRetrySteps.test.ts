import { TradingApi } from '@universe/api'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import {
  collapseRetryStepsForDisplay,
  findLatestActiveFailedStep,
  getLogicalStepKey,
  getPlanStepsForDisplay,
} from 'uniswap/src/features/transactions/swap/plan/collapseRetrySteps'
import type { TransactionAndPlanStep } from 'uniswap/src/features/transactions/swap/plan/planStepTransformer'
import { describe, expect, it } from 'vitest'

const BRIDGE_KEY = 'BRIDGE:0xEth:1:0xEth:42161'
const SWAP_KEY = 'SWAP:0xUsdc:42161:0xWbtc:42161'
const CHANGED_ROUTE_SWAP_KEY = 'SWAP:0xUsdc:42161:0xWeth:42161'

// Each call returns a NEW object so retry rows for the same logical step coexist as distinct
// array entries, mirroring the trading backend's regeneration merge (preserved + errors +
// regenerated, re-indexed sequentially).
function createPlanStep(overrides: Partial<TransactionAndPlanStep> = {}): TransactionAndPlanStep {
  return {
    stepIndex: 0,
    stepType: TradingApi.PlanStepType.CLASSIC,
    status: TradingApi.PlanStepStatus.AWAITING_ACTION,
    method: TradingApi.PlanStepMethod.SEND_TX,
    payload: {},
    routingStepKey: SWAP_KEY,
    tokenInChainId: UniverseChainId.ArbitrumOne as unknown as TradingApi.ChainId,
    tokenOutChainId: UniverseChainId.ArbitrumOne as unknown as TradingApi.ChainId,
    tokenIn: '0xUsdc',
    tokenOut: '0xWbtc',
    tokenInAmount: '1000000',
    tokenOutAmount: '1000000',
    type: TransactionStepType.SwapTransaction,
    txRequest: {
      to: '0x8c106EEDAd96553e64287A5A6839c3Cc78afA3D0',
      chainId: UniverseChainId.ArbitrumOne,
      data: '0x',
      value: '0',
    },
    ...overrides,
  } as TransactionAndPlanStep
}

function createBridgeStep(overrides: Partial<TransactionAndPlanStep> = {}): TransactionAndPlanStep {
  return createPlanStep({
    stepType: TradingApi.PlanStepType.BRIDGE,
    routingStepKey: BRIDGE_KEY,
    tokenInChainId: UniverseChainId.Mainnet as unknown as TradingApi.ChainId,
    tokenIn: '0xEth',
    tokenOut: '0xEth',
    ...overrides,
  })
}

const { COMPLETE, STEP_ERROR, AWAITING_ACTION, NOT_READY } = TradingApi.PlanStepStatus

describe(getLogicalStepKey, () => {
  it('pairs routingStepKey with the transformed step type', () => {
    const swap = createPlanStep()
    const approval = createPlanStep({ type: TransactionStepType.TokenApprovalTransaction })

    expect(getLogicalStepKey(swap)).toBe(`${TransactionStepType.SwapTransaction}:${SWAP_KEY}`)
    expect(getLogicalStepKey(swap)).not.toBe(getLogicalStepKey(approval))
  })

  it('falls back to the route tuple when routingStepKey is missing', () => {
    const stepA = createPlanStep({ routingStepKey: undefined })
    const stepB = createPlanStep({ routingStepKey: undefined })
    const differentRoute = createPlanStep({ routingStepKey: undefined, tokenOut: '0xWeth' })

    expect(getLogicalStepKey(stepA)).toBeDefined()
    expect(getLogicalStepKey(stepA)).toBe(getLogicalStepKey(stepB))
    expect(getLogicalStepKey(stepA)).not.toBe(getLogicalStepKey(differentRoute))
  })

  it('returns undefined (never collapsed) when no identity is available', () => {
    const step = createPlanStep({ routingStepKey: undefined, tokenIn: undefined })

    expect(getLogicalStepKey(step)).toBeUndefined()
  })
})

describe(findLatestActiveFailedStep, () => {
  it('returns undefined for an empty array and for plans without failures', () => {
    expect(findLatestActiveFailedStep([])).toBeUndefined()
    expect(findLatestActiveFailedStep([createPlanStep({ status: COMPLETE }), createPlanStep()])).toBeUndefined()
  })

  it('returns the most recent failed row', () => {
    const older = createPlanStep({ status: STEP_ERROR })
    const latest = createPlanStep({ status: STEP_ERROR })

    expect(findLatestActiveFailedStep([createBridgeStep({ status: COMPLETE }), older, latest, createPlanStep()])).toBe(
      latest,
    )
  })

  it('finds failed rows trailing the actionable row (position-independent)', () => {
    const failed = createPlanStep({ status: STEP_ERROR })

    expect(findLatestActiveFailedStep([createPlanStep({ status: AWAITING_ACTION }), failed])).toBe(failed)
  })

  it('ignores failures recovered by a later COMPLETE row', () => {
    const failed = createPlanStep({ status: STEP_ERROR })

    expect(findLatestActiveFailedStep([failed, createPlanStep({ status: COMPLETE })])).toBeUndefined()
  })
})

describe(collapseRetryStepsForDisplay, () => {
  it('returns an empty array unchanged', () => {
    expect(collapseRetryStepsForDisplay({ steps: [], isSubmitting: false })).toEqual([])
  })

  it('keeps an all-complete plan unchanged', () => {
    const steps = [createBridgeStep({ status: COMPLETE }), createPlanStep({ status: COMPLETE })]

    expect(collapseRetryStepsForDisplay({ steps, isSubmitting: false })).toEqual(steps)
  })

  it('keeps a no-failure in-progress plan unchanged', () => {
    const steps = [createBridgeStep({ status: COMPLETE }), createPlanStep(), createPlanStep({ status: NOT_READY })]

    expect(collapseRetryStepsForDisplay({ steps, isSubmitting: false })).toEqual(steps)
  })

  it('collapses the ticket scenario to one row per logical step, keeping the latest failed attempt', () => {
    const bridge = createBridgeStep({ status: COMPLETE, stepIndex: 0 })
    const olderFailure = createPlanStep({ status: STEP_ERROR, stepIndex: 1 })
    const latestFailure = createPlanStep({ status: STEP_ERROR, stepIndex: 2 })
    const regenerated = createPlanStep({ status: AWAITING_ACTION, stepIndex: 3 })
    const steps = [bridge, olderFailure, latestFailure, regenerated]

    expect(collapseRetryStepsForDisplay({ steps, isSubmitting: false })).toEqual([bridge, latestFailure])
  })

  it('shows the live row and hides all failed attempts while submitting a retry', () => {
    const bridge = createBridgeStep({ status: COMPLETE, stepIndex: 0 })
    const olderFailure = createPlanStep({ status: STEP_ERROR, stepIndex: 1 })
    const latestFailure = createPlanStep({ status: STEP_ERROR, stepIndex: 2 })
    const regenerated = createPlanStep({ status: AWAITING_ACTION, stepIndex: 3 })
    const steps = [bridge, olderFailure, latestFailure, regenerated]

    expect(collapseRetryStepsForDisplay({ steps, isSubmitting: true })).toEqual([bridge, regenerated])
  })

  it('suppresses the regenerated duplicate after a single failure', () => {
    const bridge = createBridgeStep({ status: COMPLETE, stepIndex: 0 })
    const failed = createPlanStep({ status: STEP_ERROR, stepIndex: 1 })
    const regenerated = createPlanStep({ status: AWAITING_ACTION, stepIndex: 2 })

    expect(collapseRetryStepsForDisplay({ steps: [bridge, failed, regenerated], isSubmitting: false })).toEqual([
      bridge,
      failed,
    ])
  })

  it('hides nothing when the failure has no regenerated row', () => {
    const steps = [
      createBridgeStep({ status: COMPLETE, stepIndex: 0 }),
      createPlanStep({ status: STEP_ERROR, stepIndex: 1 }),
    ]

    expect(collapseRetryStepsForDisplay({ steps, isSubmitting: false })).toEqual(steps)
    expect(collapseRetryStepsForDisplay({ steps, isSubmitting: true })).toEqual(steps)
  })

  it('keeps both rows when the replan changed the route (different logical step)', () => {
    const failed = createPlanStep({ status: STEP_ERROR, stepIndex: 0 })
    const changedRoute = createPlanStep({
      status: AWAITING_ACTION,
      stepIndex: 1,
      routingStepKey: CHANGED_ROUTE_SWAP_KEY,
      tokenOut: '0xWeth',
    })

    expect(collapseRetryStepsForDisplay({ steps: [failed, changedRoute], isSubmitting: false })).toEqual([
      failed,
      changedRoute,
    ])
  })

  it('collapses failed rows trailing the actionable row (universe#31652 fixture shape)', () => {
    const bridge = createBridgeStep({ status: COMPLETE, stepIndex: 0 })
    const actionable = createPlanStep({ status: AWAITING_ACTION, stepIndex: 1 })
    const olderFailure = createPlanStep({ status: STEP_ERROR, stepIndex: 2 })
    const latestFailure = createPlanStep({ status: STEP_ERROR, stepIndex: 3 })
    const steps = [bridge, actionable, olderFailure, latestFailure]

    expect(collapseRetryStepsForDisplay({ steps, isSubmitting: false })).toEqual([bridge, latestFailure])
  })

  it('hides failed attempts once the step recovered (COMPLETE row after the failures)', () => {
    const failedLeg1 = createBridgeStep({ status: STEP_ERROR, stepIndex: 0 })
    const recoveredLeg1 = createBridgeStep({ status: COMPLETE, stepIndex: 1 })
    const failedLeg2 = createPlanStep({ status: STEP_ERROR, stepIndex: 2 })
    const regeneratedLeg2 = createPlanStep({ status: AWAITING_ACTION, stepIndex: 3 })
    const steps = [failedLeg1, recoveredLeg1, failedLeg2, regeneratedLeg2]

    expect(collapseRetryStepsForDisplay({ steps, isSubmitting: false })).toEqual([recoveredLeg1, failedLeg2])
  })

  it('never hides rows without a logical-step identity', () => {
    const failed = createPlanStep({ status: STEP_ERROR, routingStepKey: undefined, tokenIn: undefined })
    const awaiting = createPlanStep({ status: AWAITING_ACTION, routingStepKey: undefined, tokenIn: undefined })
    const steps = [failed, awaiting]

    expect(collapseRetryStepsForDisplay({ steps, isSubmitting: false })).toEqual(steps)
  })
})

describe(getPlanStepsForDisplay, () => {
  it('selects the latest failed row as the display step while awaiting a retry', () => {
    const bridge = createBridgeStep({ status: COMPLETE, stepIndex: 0 })
    const olderFailure = createPlanStep({ status: STEP_ERROR, stepIndex: 1 })
    const latestFailure = createPlanStep({ status: STEP_ERROR, stepIndex: 2 })
    const regenerated = createPlanStep({ status: AWAITING_ACTION, stepIndex: 3 })

    const { displaySteps, displayStep } = getPlanStepsForDisplay({
      steps: [bridge, olderFailure, latestFailure, regenerated],
      currentStep: regenerated,
      isSubmitting: false,
    })

    expect(displaySteps).toEqual([bridge, latestFailure])
    expect(displayStep).toBe(latestFailure)
    expect(displaySteps).toContain(displayStep)
  })

  it('selects the live row as the display step while submitting', () => {
    const bridge = createBridgeStep({ status: COMPLETE, stepIndex: 0 })
    const failed = createPlanStep({ status: STEP_ERROR, stepIndex: 1 })
    const regenerated = createPlanStep({ status: AWAITING_ACTION, stepIndex: 2 })

    const { displaySteps, displayStep } = getPlanStepsForDisplay({
      steps: [bridge, failed, regenerated],
      currentStep: regenerated,
      isSubmitting: true,
    })

    expect(displaySteps).toEqual([bridge, regenerated])
    expect(displayStep).toBe(regenerated)
  })

  it('keeps the current step for a plan without failures', () => {
    const bridge = createBridgeStep({ status: COMPLETE, stepIndex: 0 })
    const current = createPlanStep({ status: AWAITING_ACTION, stepIndex: 1 })

    const { displaySteps, displayStep } = getPlanStepsForDisplay({
      steps: [bridge, current],
      currentStep: current,
      isSubmitting: false,
    })

    expect(displaySteps).toEqual([bridge, current])
    expect(displayStep).toBe(current)
  })

  it("falls back to the logical step's visible row when the current step was collapsed away", () => {
    const failed = createPlanStep({ status: STEP_ERROR, stepIndex: 0 })
    const regenerated = createPlanStep({ status: AWAITING_ACTION, stepIndex: 1 })

    // Pathological input: currentStep points at the failed row while submitting.
    const { displaySteps, displayStep } = getPlanStepsForDisplay({
      steps: [failed, regenerated],
      currentStep: failed,
      isSubmitting: true,
    })

    expect(displaySteps).toEqual([regenerated])
    expect(displayStep).toBe(regenerated)
  })
})
