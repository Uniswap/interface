import { TradingApi } from '@universe/api'
import { computeStepStatus, ProgressIndicator } from 'uniswap/src/components/ConfirmSwapModal/ProgressIndicator'
import { StepStatus } from 'uniswap/src/components/ConfirmSwapModal/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TransactionStep, TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { getPlanStepsForDisplay } from 'uniswap/src/features/transactions/swap/plan/collapseRetrySteps'
import type { TransactionAndPlanStep } from 'uniswap/src/features/transactions/swap/plan/planStepTransformer'
import { renderWithProviders } from 'uniswap/src/test/render'
import { describe, expect, it } from 'vitest'

// NOTE: the vitest setup mocks i18n so t() returns the raw key — row titles are asserted as
// i18n keys (e.g. 'swap.review.swap.idle'), which still uniquely identify row kind and status.
const USDC_ARBITRUM = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'
const WBTC_ARBITRUM = '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f'
const WETH_ARBITRUM = '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1'
const NATIVE = '0x0000000000000000000000000000000000000000'

const BRIDGE_KEY = `BRIDGE:${NATIVE}:1:${NATIVE}:42161`
const SWAP_KEY = `SWAP:${USDC_ARBITRUM}:42161:${WBTC_ARBITRUM}:42161`

// Builds the Arbitrum swap leg of a bridge-then-swap chained action. Each call returns a NEW
// object so retry rows for the same logical step coexist as distinct array entries, mirroring the
// trading backend's regeneration merge (preserved + errors + regenerated, re-indexed
// sequentially — stepIndex is always unique and equal to array position in real payloads).
function createSwapPlanStep(overrides: Partial<TransactionAndPlanStep> = {}): TransactionAndPlanStep {
  return {
    stepIndex: 0,
    stepType: TradingApi.PlanStepType.CLASSIC,
    status: TradingApi.PlanStepStatus.AWAITING_ACTION,
    method: TradingApi.PlanStepMethod.SEND_TX,
    payload: {},
    routingStepKey: SWAP_KEY,
    tokenInChainId: UniverseChainId.ArbitrumOne as unknown as TradingApi.ChainId,
    tokenOutChainId: UniverseChainId.ArbitrumOne as unknown as TradingApi.ChainId,
    tokenIn: USDC_ARBITRUM,
    tokenOut: WBTC_ARBITRUM,
    tokenInAmount: '1000000',
    tokenOutAmount: '1000000',
    slippage: 0.5,
    type: TransactionStepType.SwapTransaction,
    txRequest: {
      to: WBTC_ARBITRUM,
      chainId: UniverseChainId.ArbitrumOne,
      data: '0x',
      value: '0',
    },
    ...overrides,
  } as TransactionAndPlanStep
}

// Builds the completed cross-chain bridge leg (Ethereum -> Arbitrum).
function createBridgePlanStep(overrides: Partial<TransactionAndPlanStep> = {}): TransactionAndPlanStep {
  return createSwapPlanStep({
    stepType: TradingApi.PlanStepType.BRIDGE,
    status: TradingApi.PlanStepStatus.COMPLETE,
    routingStepKey: BRIDGE_KEY,
    tokenInChainId: UniverseChainId.Mainnet as unknown as TradingApi.ChainId,
    tokenIn: NATIVE,
    tokenOut: NATIVE,
    ...overrides,
  })
}

// Builds a plain (non-chained) approval step: no stepIndex / status fields.
function createApprovalStep(tokenAddress: string): TransactionStep {
  return {
    type: TransactionStepType.TokenApprovalTransaction,
    tokenAddress,
    chainId: UniverseChainId.ArbitrumOne,
    amount: '1000000',
    spender: '0x000000000000000000000000000000000000dEaD',
    txRequest: {
      to: tokenAddress,
      chainId: UniverseChainId.ArbitrumOne,
      data: '0x095ea7b3',
      value: '0',
    },
  } as unknown as TransactionStep
}

// Builds a plain (non-chained) swap step: no stepIndex / status fields.
function createClassicSwapStep(): TransactionStep {
  return {
    type: TransactionStepType.SwapTransaction,
    txRequest: {
      to: WBTC_ARBITRUM,
      chainId: UniverseChainId.ArbitrumOne,
      data: '0x',
      value: '0',
    },
  } as unknown as TransactionStep
}

// Maps every step to its computed status so a whole render pass is easy to assert on.
function statusesFor(
  steps: TransactionStep[],
  currentStep: { step: TransactionStep; accepted: boolean } | undefined,
): StepStatus[] {
  return steps.map((step) => computeStepStatus({ steps, currentStep, targetStep: step }))
}

describe('ProgressIndicator + collapsed chained-action retry rows', () => {
  it('renders one row per logical step for the ticket scenario (bridge done, swap failed twice, retry pending)', () => {
    const bridge = createBridgePlanStep({ stepIndex: 0 })
    const olderFailure = createSwapPlanStep({ stepIndex: 1, status: TradingApi.PlanStepStatus.STEP_ERROR })
    const latestFailure = createSwapPlanStep({ stepIndex: 2, status: TradingApi.PlanStepStatus.STEP_ERROR })
    const regenerated = createSwapPlanStep({ stepIndex: 3, status: TradingApi.PlanStepStatus.AWAITING_ACTION })

    const { displaySteps, displayStep } = getPlanStepsForDisplay({
      steps: [bridge, olderFailure, latestFailure, regenerated],
      currentStep: regenerated,
      isSubmitting: false,
    })

    const { queryAllByText, queryByText } = renderWithProviders(
      <ProgressIndicator isChainedAction steps={displaySteps} currentStep={{ step: displayStep, accepted: false }} />,
    )

    // 2 visible rows: the completed bridge and ONE swap row (not one per attempt).
    expect(displaySteps).toHaveLength(2)
    expect(queryByText('swap.review.bridge.completed')).toBeTruthy()
    expect(queryAllByText('swap.review.swap.idle')).toHaveLength(1)
    // Exactly one Failed badge, carried by the latest failed attempt (bold Failed treatment).
    expect(queryAllByText('common.failed')).toHaveLength(1)
    expect(statusesFor(displaySteps, { step: displayStep, accepted: false })).toEqual([
      StepStatus.Complete,
      StepStatus.Failed,
    ])
  })

  it('renders the live row without any Failed badge while the retry is submitting', () => {
    const bridge = createBridgePlanStep({ stepIndex: 0 })
    const olderFailure = createSwapPlanStep({ stepIndex: 1, status: TradingApi.PlanStepStatus.STEP_ERROR })
    const latestFailure = createSwapPlanStep({ stepIndex: 2, status: TradingApi.PlanStepStatus.STEP_ERROR })
    const regenerated = createSwapPlanStep({ stepIndex: 3, status: TradingApi.PlanStepStatus.AWAITING_ACTION })

    const { displaySteps, displayStep } = getPlanStepsForDisplay({
      steps: [bridge, olderFailure, latestFailure, regenerated],
      currentStep: regenerated,
      isSubmitting: true,
    })

    const { queryAllByText, queryByText } = renderWithProviders(
      <ProgressIndicator isChainedAction steps={displaySteps} currentStep={{ step: displayStep, accepted: true }} />,
    )

    expect(displaySteps).toHaveLength(2)
    expect(queryAllByText('common.failed')).toHaveLength(0)
    expect(queryByText('swap.review.swap.pending')).toBeTruthy()
    expect(statusesFor(displaySteps, { step: displayStep, accepted: true })).toEqual([
      StepStatus.Complete,
      StepStatus.InProgress,
    ])
  })

  it('renders a single failure as one Failed row, not a failed row plus its regenerated duplicate', () => {
    const bridge = createBridgePlanStep({ stepIndex: 0 })
    const failed = createSwapPlanStep({ stepIndex: 1, status: TradingApi.PlanStepStatus.STEP_ERROR })
    const regenerated = createSwapPlanStep({ stepIndex: 2, status: TradingApi.PlanStepStatus.AWAITING_ACTION })

    const { displaySteps, displayStep } = getPlanStepsForDisplay({
      steps: [bridge, failed, regenerated],
      currentStep: regenerated,
      isSubmitting: false,
    })

    const { queryAllByText } = renderWithProviders(
      <ProgressIndicator isChainedAction steps={displaySteps} currentStep={{ step: displayStep, accepted: false }} />,
    )

    expect(displaySteps).toEqual([bridge, failed])
    expect(queryAllByText('swap.review.swap.idle')).toHaveLength(1)
    expect(queryAllByText('common.failed')).toHaveLength(1)
  })

  it('keeps both rows visible when the replan changed the route', () => {
    const failed = createSwapPlanStep({ stepIndex: 0, status: TradingApi.PlanStepStatus.STEP_ERROR })
    const changedRoute = createSwapPlanStep({
      stepIndex: 1,
      status: TradingApi.PlanStepStatus.AWAITING_ACTION,
      routingStepKey: `SWAP:${USDC_ARBITRUM}:42161:${WETH_ARBITRUM}:42161`,
      tokenOut: WETH_ARBITRUM,
    })

    const { displaySteps, displayStep } = getPlanStepsForDisplay({
      steps: [failed, changedRoute],
      currentStep: changedRoute,
      isSubmitting: false,
    })

    const { queryAllByText } = renderWithProviders(
      <ProgressIndicator isChainedAction steps={displaySteps} currentStep={{ step: displayStep, accepted: false }} />,
    )

    expect(displaySteps).toHaveLength(2)
    // Both the failed old-route row and the distinct new-route row stay visible.
    expect(queryAllByText('swap.review.swap.idle')).toHaveLength(2)
    expect(queryAllByText('common.failed')).toHaveLength(1)
    expect(statusesFor(displaySteps, { step: displayStep, accepted: false })).toEqual([
      StepStatus.Failed,
      StepStatus.Preview,
    ])
  })

  it('renders the happy path unchanged when nothing failed', () => {
    const bridge = createBridgePlanStep({ stepIndex: 0 })
    const swap = createSwapPlanStep({ stepIndex: 1, status: TradingApi.PlanStepStatus.AWAITING_ACTION })

    const { displaySteps, displayStep } = getPlanStepsForDisplay({
      steps: [bridge, swap],
      currentStep: swap,
      isSubmitting: false,
    })

    const { queryAllByText, queryByText } = renderWithProviders(
      <ProgressIndicator isChainedAction steps={displaySteps} currentStep={{ step: displayStep, accepted: false }} />,
    )

    expect(displaySteps).toEqual([bridge, swap])
    expect(queryByText('swap.review.bridge.completed')).toBeTruthy()
    expect(queryByText('swap.review.swap.idle')).toBeTruthy()
    expect(queryAllByText('common.failed')).toHaveLength(0)
    expect(statusesFor(displaySteps, { step: displayStep, accepted: false })).toEqual([
      StepStatus.Complete,
      StepStatus.Active,
    ])
  })

  it('renders a classic (non-chained) swap unchanged', () => {
    const approval = createApprovalStep(USDC_ARBITRUM)
    const swap = createClassicSwapStep()
    const steps = [approval, swap]

    const { queryByText, queryAllByText } = renderWithProviders(
      <ProgressIndicator steps={steps} currentStep={{ step: swap, accepted: false }} />,
    )

    expect(queryByText('common.approvedSpend')).toBeTruthy()
    expect(queryByText('common.confirmSwap')).toBeTruthy()
    expect(queryAllByText('common.failed')).toHaveLength(0)
    expect(statusesFor(steps, { step: swap, accepted: false })).toEqual([StepStatus.Complete, StepStatus.Active])
  })
})

describe(computeStepStatus, () => {
  it('highlights the single failed step when it is the current step', () => {
    const completed = createBridgePlanStep({ stepIndex: 0 })
    const failed = createSwapPlanStep({ stepIndex: 1, status: TradingApi.PlanStepStatus.STEP_ERROR })
    const steps = [completed, failed]
    const currentStep = { step: failed, accepted: false }

    expect(statusesFor(steps, currentStep)).toEqual([StepStatus.Complete, StepStatus.Failed])
  })

  it('dims failed rows that are not the current step to Replaced', () => {
    const completed = createBridgePlanStep({ stepIndex: 0 })
    const olderFailure = createSwapPlanStep({ stepIndex: 1, status: TradingApi.PlanStepStatus.STEP_ERROR })
    const latestFailure = createSwapPlanStep({ stepIndex: 2, status: TradingApi.PlanStepStatus.STEP_ERROR })
    const awaitingRetry = createSwapPlanStep({ stepIndex: 3, status: TradingApi.PlanStepStatus.AWAITING_ACTION })
    const steps = [completed, olderFailure, latestFailure, awaitingRetry]
    const currentStep = { step: latestFailure, accepted: false }

    expect(statusesFor(steps, currentStep)).toEqual([
      StepStatus.Complete,
      StepStatus.Replaced,
      StepStatus.Failed,
      StepStatus.Preview,
    ])
  })

  it('resolves the current step by object identity even for duplicate stepIndex rows (defensive: real payloads always re-index rows uniquely)', () => {
    const completed = createBridgePlanStep({ stepIndex: 0 })
    const failedFirst = createSwapPlanStep({ stepIndex: 1, status: TradingApi.PlanStepStatus.STEP_ERROR })
    const failedSecond = createSwapPlanStep({ stepIndex: 1, status: TradingApi.PlanStepStatus.STEP_ERROR })
    const steps = [completed, failedFirst, failedSecond]

    expect(statusesFor(steps, { step: failedSecond, accepted: false })).toEqual([
      StepStatus.Complete,
      StepStatus.Replaced,
      StepStatus.Failed,
    ])
    expect(statusesFor(steps, { step: failedFirst, accepted: false })).toEqual([
      StepStatus.Complete,
      StepStatus.Failed,
      StepStatus.Replaced,
    ])
  })

  it('shows completed / active / preview for a normal in-progress chained flow with no failures', () => {
    const completed = createBridgePlanStep({ stepIndex: 0 })
    const current = createSwapPlanStep({ stepIndex: 1, status: TradingApi.PlanStepStatus.AWAITING_ACTION })
    const upcoming = createSwapPlanStep({ stepIndex: 2, status: TradingApi.PlanStepStatus.NOT_READY })
    const steps = [completed, current, upcoming]

    expect(statusesFor(steps, { step: current, accepted: false })).toEqual([
      StepStatus.Complete,
      StepStatus.Active,
      StepStatus.Preview,
    ])
    // When accepted (submitted), the current row spins as InProgress instead of Active.
    expect(statusesFor(steps, { step: current, accepted: true })).toEqual([
      StepStatus.Complete,
      StepStatus.InProgress,
      StepStatus.Preview,
    ])
  })

  it('highlights the correct approval among multiple token approvals via the field-match fallback', () => {
    const approvalA = createApprovalStep('0xAAAA000000000000000000000000000000000000')
    const approvalB = createApprovalStep('0xBBBB000000000000000000000000000000000000')
    const steps = [approvalA, approvalB]
    // currentStep.step is a FRESH object (not a reference into steps) that matches approvalB by
    // tokenAddress — this exercises the createIsCurrentStep fallback + approval-token matching.
    const currentStep = { step: createApprovalStep('0xBBBB000000000000000000000000000000000000'), accepted: false }

    expect(statusesFor(steps, currentStep)).toEqual([StepStatus.Complete, StepStatus.Active])
  })

  it('does not crash and produces sensible statuses when currentStep is undefined', () => {
    const failed = createSwapPlanStep({ stepIndex: 0, status: TradingApi.PlanStepStatus.STEP_ERROR })
    const awaiting = createSwapPlanStep({ stepIndex: 1, status: TradingApi.PlanStepStatus.AWAITING_ACTION })
    const steps = [failed, awaiting]

    // No current step => nothing is "current"; failed rows dim to Replaced, others preview.
    expect(statusesFor(steps, undefined)).toEqual([StepStatus.Replaced, StepStatus.Preview])
  })

  it('honors object identity for a non-chained regular swap when currentStep.step is a reference into steps', () => {
    const approval = createApprovalStep('0xAAAA000000000000000000000000000000000000')
    const swap = createClassicSwapStep()
    const steps = [approval, swap]
    const currentStep = { step: swap, accepted: false }

    expect(statusesFor(steps, currentStep)).toEqual([StepStatus.Complete, StepStatus.Active])
  })
})
