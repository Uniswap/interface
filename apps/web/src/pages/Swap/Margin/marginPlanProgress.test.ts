import { TradingApi } from '@universe/api'
import { UniverseChainId } from '@universe/chains'
import { ArrowBack } from '@universe/mycelium/icons/ArrowBack'
import { ArrowDown } from '@universe/mycelium/icons/ArrowDown'
import { ArrowUp } from '@universe/mycelium/icons/ArrowUp'
import { Check } from '@universe/mycelium/icons/Check'
import { Minus } from '@universe/mycelium/icons/Minus'
import { Plus } from '@universe/mycelium/icons/Plus'
import { X } from '@universe/mycelium/icons/X'
import { TFunction } from 'i18next'
import { computeStepStatus } from 'uniswap/src/components/ConfirmSwapModal/ProgressIndicator'
import { isMarginExecuteStep } from 'uniswap/src/components/ConfirmSwapModal/steps/MarginExecuteStepRow'
import { StepStatus } from 'uniswap/src/components/ConfirmSwapModal/types'
import {
  MARGIN_NATIVE_TOKEN_ADDRESS,
  type MarginPlanResponse,
  type MarginPlanStep,
  type MarginPlanStepType,
} from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { describe, expect, it } from 'vitest'
import { type MarginPlanProgress, marginPlanProgress } from '~/pages/Swap/Margin/marginPlanProgress'
import { resolveRestartSubject } from '~/pages/Swap/Margin/MarginPlanReviewModal'

// Passthrough stub — asserts on the i18n key itself rather than translated copy.
const mockT = ((key: string) => key) as TFunction

const WETH = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
const USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
const USDT = '0xdac17f958d2ee523a2206206994597c13d831ec7'
const SPENDER = '0x000000000022d473030f116ddee9f6b43ac78ba3'
// approve(SPENDER, 1000) and approve(SPENDER, 0), as the plan service materializes them.
const APPROVE_1000 = `0x095ea7b3${SPENDER.slice(2).padStart(64, '0')}${(1000).toString(16).padStart(64, '0')}`
const APPROVE_ZERO = `0x095ea7b3${SPENDER.slice(2).padStart(64, '0')}${'0'.padStart(64, '0')}`

function step(
  stepIndex: number,
  stepType: MarginPlanStepType,
  overrides: Partial<MarginPlanStep> = {},
): MarginPlanStep {
  return {
    stepIndex,
    stepType,
    method: 'SEND_TX',
    payloadType: 'TX',
    payload: {},
    status: 'AWAITING_ACTION',
    ...overrides,
  }
}

function plan(steps: MarginPlanStep[], overrides: Partial<MarginPlanResponse> = {}): MarginPlanResponse {
  return {
    requestId: 'r',
    planId: 'p',
    swapper: '0x2222222222222222222222222222222222222222',
    intent: 'ADJUST',
    marketKey: 'mk',
    collateralToken: WETH,
    debtToken: USDC,
    subId: '1',
    status: 'AWAITING_ACTION',
    currentStepIndex: 0,
    steps,
    createdAt: '',
    updatedAt: '',
    ...overrides,
  }
}

function progressOf(
  steps: MarginPlanStep[],
  {
    failingStepIndex,
    isWalletPromptOpen = false,
    planOverrides,
  }: { failingStepIndex?: number; isWalletPromptOpen?: boolean; planOverrides?: Partial<MarginPlanResponse> } = {},
): MarginPlanProgress {
  return marginPlanProgress({
    plan: plan(steps, planOverrides),
    failingStepIndex,
    isWalletPromptOpen,
    t: mockT,
  })
}

// What the shared ProgressIndicator will draw for each row.
function statusesOf(progress: MarginPlanProgress): StepStatus[] {
  return progress.steps.map((targetStep) =>
    computeStepStatus({ steps: progress.steps, currentStep: progress.currentStep, targetStep }),
  )
}

describe('marginPlanProgress — step mapping', () => {
  it('maps an approval onto the shared approval step, naming the token and the spender the calldata approves', () => {
    const [approval] = progressOf([
      step(0, 'APPROVAL_TXN', {
        tokenIn: USDC,
        tokenInAmount: '1000',
        payload: { to: USDC, data: APPROVE_1000, chainId: 1 },
      }),
    ]).steps
    expect(approval).toMatchObject({
      type: TransactionStepType.TokenApprovalTransaction,
      tokenAddress: USDC,
      chainId: UniverseChainId.Mainnet,
      amount: '1000',
      spender: SPENDER,
    })
  })

  // USDT-style tokens need an approve-to-zero first; as an approval row too, the pair read as two
  // identical "Approve USDT" rows.
  it('maps the approve-to-zero half onto the shared revocation step', () => {
    const [reset, approve] = progressOf([
      step(0, 'RESET_APPROVAL_TXN', { tokenIn: USDT, payload: { to: USDT, data: APPROVE_ZERO, chainId: 1 } }),
      step(1, 'APPROVAL_TXN', { tokenIn: USDT, tokenInAmount: '1000', status: 'NOT_READY' }),
    ]).steps
    expect(reset).toMatchObject({
      type: TransactionStepType.TokenRevocationTransaction,
      tokenAddress: USDT,
      amount: '0',
    })
    expect(approve).toMatchObject({ type: TransactionStepType.TokenApprovalTransaction, tokenAddress: USDT })
  })

  it('still gives a step that is not materialized yet a row, addressed to its token', () => {
    const [approve] = progressOf([step(0, 'APPROVAL_TXN', { tokenIn: USDT, status: 'NOT_READY' })]).steps
    expect(approve).toMatchObject({ txRequest: { to: USDT, chainId: 1 }, spender: '' })
  })

  it('maps a permit onto the shared Permit2 signature step with its typed data', () => {
    const payload = {
      domain: { name: 'Permit2', chainId: 1, verifyingContract: SPENDER },
      types: { PermitSingle: [{ name: 'spender', type: 'address' }] },
      values: { spender: SPENDER },
    }
    const [permit] = progressOf([
      step(0, 'APPROVAL_PERMIT', { method: 'SIGN_MSG', payloadType: 'EIP_712', payload }),
    ]).steps
    expect(permit).toMatchObject({ type: TransactionStepType.Permit2Signature, ...payload })
  })

  it('maps a WRAP funding leg onto the shared wrap step, wrapping native ETH', () => {
    const [wrap] = progressOf([
      step(0, 'MARGIN_PRE_SWAP', {
        wireStepType: TradingApi.PlanStepType.WRAP,
        tokenIn: MARGIN_NATIVE_TOKEN_ADDRESS,
        tokenInAmount: '1000000000000000',
        tokenOut: WETH,
      }),
    ]).steps
    expect(wrap.type).toBe(TransactionStepType.WrapTransaction)
    if (wrap.type !== TransactionStepType.WrapTransaction) {
      throw new Error('expected a wrap step')
    }
    expect(wrap.amount.currency.isNative).toBe(true)
    expect(wrap.amount.currency.symbol).toBe('ETH')
    expect(wrap.amount.quotient.toString()).toBe('1000000000000000')
    expect(wrap.txRequest.to).toBe(WETH)
  })

  // Only a WRAP has a shared row of its own; the swap plan row names an UNWRAP "Swap WETH → ETH".
  it.each([TradingApi.PlanStepType.CLASSIC, TradingApi.PlanStepType.UNWRAP, undefined])(
    'maps a %s pre-swap onto the swap plan row with its token pair',
    (wireStepType) => {
      const [swap] = progressOf([step(0, 'MARGIN_PRE_SWAP', { wireStepType, tokenIn: USDC, tokenOut: WETH })]).steps
      expect(swap).toMatchObject({
        type: TransactionStepType.SwapTransaction,
        tokenIn: USDC,
        tokenOut: WETH,
        tokenInChainId: UniverseChainId.Mainnet,
        tokenOutChainId: UniverseChainId.Mainnet,
      })
      expect(isMarginExecuteStep(swap)).toBe(false)
    },
  )

  it('maps a bridge onto the swap plan row with both chains, defaulting the destination to the margin chain', () => {
    const [bridge] = progressOf([
      step(0, 'MARGIN_BRIDGE', { tokenIn: USDC, tokenInChainId: UniverseChainId.Unichain, tokenOutChainId: undefined }),
    ]).steps
    expect(bridge).toMatchObject({
      type: TransactionStepType.SwapTransaction,
      tokenInChainId: UniverseChainId.Unichain,
      tokenOutChainId: UniverseChainId.Mainnet,
    })
  })

  it('falls back to the margin chain for a chain id the app does not support', () => {
    const [bridge] = progressOf([step(0, 'MARGIN_BRIDGE', { tokenInChainId: 999_999 })]).steps
    expect(bridge.tokenInChainId).toBe(UniverseChainId.Mainnet)
  })

  it.each([
    ['MARGIN_OPEN', undefined, 'margin.plan.step.open'],
    ['MARGIN_CLOSE', undefined, 'margin.plan.step.close'],
    ['MARGIN_RECOVER', undefined, 'margin.plan.step.recover'],
    ['MARGIN_ADJUST', 'addEquity', 'margin.plan.step.addMargin'],
    ['MARGIN_ADJUST', 'withdrawEquity', 'margin.plan.step.withdrawMargin'],
    ['MARGIN_ADJUST', 'increaseLeverage', 'margin.plan.step.increasePosition'],
    ['MARGIN_ADJUST', 'decreaseLeverage', 'margin.plan.step.decreasePosition'],
  ] as const)('maps a %s step under a %s plan onto the margin row titled %s', (stepType, action, title) => {
    const [execute] = progressOf([step(0, stepType)], { planOverrides: { action } }).steps
    expect(isMarginExecuteStep(execute)).toBe(true)
    expect(execute).toMatchObject({ stepType: TradingApi.PlanStepType.MARGIN_EXECUTE, marginStepTitle: title })
  })
})

describe('marginPlanProgress — execute step icons', () => {
  it.each([
    ['MARGIN_OPEN', 'open', Check],
    ['MARGIN_CLOSE', 'close', X],
    ['MARGIN_ADJUST', 'addEquity', ArrowDown],
    ['MARGIN_ADJUST', 'withdrawEquity', ArrowUp],
    ['MARGIN_ADJUST', 'increaseLeverage', Plus],
    ['MARGIN_ADJUST', 'decreaseLeverage', Minus],
    ['MARGIN_RECOVER', undefined, ArrowBack],
  ] as const)('gives a %s step under a %s plan its step icon', (stepType, action, Icon) => {
    const [execute] = progressOf([step(0, stepType)], { planOverrides: { action } }).steps
    expect(execute).toMatchObject({ marginStepIcon: Icon })
  })
})

describe('marginPlanProgress — row statuses', () => {
  const open = step(0, 'MARGIN_OPEN')

  it('reads the first unfinished step as awaiting the wallet, and later ones as upcoming', () => {
    const progress = progressOf([
      step(0, 'APPROVAL_TXN', { status: 'COMPLETE' }),
      step(1, 'MARGIN_PRE_SWAP'),
      step(2, 'MARGIN_OPEN', { status: 'NOT_READY' }),
    ])
    expect(statusesOf(progress)).toEqual([StepStatus.Complete, StepStatus.Active, StepStatus.Preview])
  })

  it('reads a step the server is working on as in progress, even with a wallet prompt open', () => {
    const progress = progressOf([step(0, 'MARGIN_BRIDGE', { status: 'IN_PROGRESS' }), step(1, 'MARGIN_OPEN')], {
      isWalletPromptOpen: true,
    })
    expect(statusesOf(progress)).toEqual([StepStatus.InProgress, StepStatus.Preview])
  })

  // The executor polls through a NOT_READY step while the server regenerates it; no wallet is
  // prompting, so the shared rows' "in wallet" copy would ask for a signature nothing has requested.
  it('reads a step the server has not materialized yet as in progress, not awaiting the wallet', () => {
    const progress = progressOf([
      step(0, 'APPROVAL_TXN', { status: 'COMPLETE' }),
      step(1, 'MARGIN_PRE_SWAP', { status: 'NOT_READY' }),
      step(2, 'MARGIN_OPEN', { status: 'NOT_READY' }),
    ])
    expect(statusesOf(progress)).toEqual([StepStatus.Complete, StepStatus.InProgress, StepStatus.Preview])
  })

  it('reads a broadcast step the server is still verifying as in progress, and as active while the wallet re-prompts', () => {
    const broadcast = { ...open, proof: { txHash: '0xabc' } }
    expect(statusesOf(progressOf([broadcast]))).toEqual([StepStatus.InProgress])
    expect(statusesOf(progressOf([broadcast], { isWalletPromptOpen: true }))).toEqual([StepStatus.Active])
  })

  // A client-minted failure writes only the store's `stepError`; the SERVER step keeps AWAITING_ACTION.
  // Without it the row renders live under a plan the red message calls dead.
  it('strikes out the step a client-minted failure names', () => {
    expect(statusesOf(progressOf([open], { failingStepIndex: 0 }))).toEqual([StepStatus.Failed])
  })

  it('leaves a step the failure does not name alone', () => {
    expect(statusesOf(progressOf([open], { failingStepIndex: 1 }))).toEqual([StepStatus.Active])
  })

  it('strikes out a step the server failed', () => {
    const progress = progressOf([
      step(0, 'MARGIN_PRE_SWAP', { status: 'COMPLETE' }),
      step(1, 'MARGIN_OPEN', { status: 'STEP_ERROR' }),
    ])
    expect(statusesOf(progress)).toEqual([StepStatus.Complete, StepStatus.Failed])
  })

  // The stall bails and runLoop's catch name `currentStepIndex` with no status check, so a client error
  // can land on an IN_PROGRESS bridge — striking it out would call a broadcast deposit awaiting fill dead.
  it('leaves an IN_PROGRESS step in progress when a client failure names it', () => {
    const progress = progressOf([step(0, 'MARGIN_BRIDGE', { status: 'IN_PROGRESS' })], { failingStepIndex: 0 })
    expect(statusesOf(progress)).toEqual([StepStatus.InProgress])
  })

  // A step that already broadcast is one the SERVER is verifying; the verification poll's budget running
  // out mints a client failure on that very step, and striking it would badge a live transaction failed.
  it('leaves a step that already broadcast in progress, even when a client failure names it', () => {
    const broadcast = { ...open, proof: { txHash: '0xabc' } }
    expect(statusesOf(progressOf([broadcast], { failingStepIndex: 0 }))).toEqual([StepStatus.InProgress])
  })

  // A plan that died with nothing stamped carries a placeholder `stepIndex: 0` naming no step — backing
  // out of the sheet before signing is exactly that. `resolveRestartSubject` turns it into undefined.
  it('leaves row 0 alone for a plan that died with no step stamped', () => {
    const { failingStepIndex } = resolveRestartSubject({
      steps: [open],
      stepError: { stepIndex: 0, code: 'PLAN_TERMINAL' },
    })
    const progress = progressOf([open], { failingStepIndex, planOverrides: { status: 'CANCELLED' } })
    expect(statusesOf(progress)).toEqual([StepStatus.Active])
  })
})
