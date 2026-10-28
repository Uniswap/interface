import { UniverseChainId } from '@universe/chains'
import { TFunction } from 'i18next'
import { StepStatus } from 'uniswap/src/components/ConfirmSwapModal/types'
import {
  MARGIN_NATIVE_TOKEN_ADDRESS,
  type MarginPlanResponse,
  type MarginPlanStep,
  type MarginPlanStepType,
} from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { MarginDirection } from 'uniswap/src/features/transactions/margin/types'
import { beforeEach, describe, expect, it } from 'vitest'
import type { MarginMarket } from '~/constants/margin'
import { __resetMemoryProofsForTest, writeStepProof } from '~/pages/Swap/Margin/hooks/marginStepProofCache'
import {
  FUNDS_MOVING_BY_STEP_TYPE,
  planMovedFunds,
  resolveFailingStepProof,
  resolveRestartSubject,
  stepTypeMovesFunds,
  planReviewDirection,
  planTitle,
  restartNote,
  stepTitle,
  toStepStatus,
} from '~/pages/Swap/Margin/MarginPlanReviewModal'

// Passthrough stub — asserts on the i18n key itself rather than translated copy.
const mockT = ((key: string) => key) as TFunction

// No test in this file relies on the injected resolver actually resolving an address — each either
// supplies tokenInSymbol directly or asserts the unresolved-fallback branch. The dedicated
// "resolveSymbol" describe block below exercises the resolver plumbing itself.
const resolveSymbol = (_address: string): string | undefined => undefined

const sameChainMarket: MarginMarket = {
  key: 'weth-usdc-MORPHO',
  asset: 'ETH',
  name: 'Wrapped Ether',
  displaySymbol: 'ETH',
  collateral: { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', symbol: 'WETH', decimals: 18 },
  debt: { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', decimals: 6 },
  venue: 'MORPHO',
  lltvWad: '860000000000000000',
  shouldUseNativeEquity: false,
}

function makeStep(
  stepType: MarginPlanStepType,
  overrides?: Partial<Pick<MarginPlanStep, 'tokenIn' | 'tokenInChainId'>>,
): MarginPlanStep {
  return {
    stepIndex: 0,
    stepType,
    method: 'SEND_TX',
    payloadType: 'TX',
    payload: {},
    status: 'AWAITING_ACTION',
    ...overrides,
  }
}

// Renders copy with i18next-style {{var}} substitution — asserts the user-visible string, not just the
// key. Templates mirror en-US.json for the keys under test; this is what exposes the "Swap Swap" bug.
const TEMPLATES: Record<string, string> = {
  'margin.plan.step.preSwap': 'Swap {{from}} → {{to}}',
  'margin.plan.step.preSwapOnChain': 'Swap {{from}} to {{to}} on {{chain}}',
  'margin.plan.step.swapToOnChain': 'Swap to {{to}} on {{chain}}',
  'margin.plan.step.approve': 'Approve {{symbol}}',
  'margin.plan.step.resetApproval': 'Reset {{symbol}} approval',
  'common.swap': 'Swap',
}
const renderT = ((key: string, vars?: Record<string, string>): string =>
  (TEMPLATES[key] ?? key).replace(/\{\{(\w+)\}\}/g, (_m, k) => vars?.[k] ?? '')) as TFunction

describe('planTitle', () => {
  it('returns the existing open title key for OPEN with no direction', () => {
    expect(planTitle({ intent: 'OPEN', direction: undefined, t: mockT })).toBe('margin.plan.title.open')
  })

  it('returns the existing open title key for OPEN + LONG', () => {
    expect(planTitle({ intent: 'OPEN', direction: MarginDirection.LONG, t: mockT })).toBe('margin.plan.title.open')
  })

  it('returns the short title key for OPEN + SHORT', () => {
    expect(planTitle({ intent: 'OPEN', direction: MarginDirection.SHORT, t: mockT })).toBe('margin.cta.openShort')
  })

  it('leaves non-OPEN intents unaffected by direction', () => {
    expect(planTitle({ intent: 'CLOSE', direction: MarginDirection.SHORT, t: mockT })).toBe('margin.plan.title.close')
  })

  it('maps ADJUST to its own title key', () => {
    expect(planTitle({ intent: 'ADJUST', direction: undefined, t: mockT })).toBe('margin.plan.title.adjust')
  })
})

describe('stepTitle', () => {
  it('reads a MARGIN_OPEN step as an open', () => {
    expect(stepTitle({ step: makeStep('MARGIN_OPEN'), t: mockT, resolveSymbol })).toBe('margin.plan.step.open')
  })

  it('maps MARGIN_ADJUST to the adjust step key', () => {
    expect(stepTitle({ step: makeStep('MARGIN_ADJUST'), t: mockT, resolveSymbol })).toBe('margin.plan.step.adjust')
  })
})

describe('stepTitle — cross-chain pre-swap', () => {
  it('renders "Swap to USDC on Unichain" — never "Swap Swap" — when the source token is unresolvable', () => {
    const title = stepTitle({
      step: makeStep('MARGIN_PRE_SWAP', { tokenIn: '0xAAA', tokenInChainId: UniverseChainId.Unichain }),
      t: renderT,
      resolveSymbol,
    })
    expect(title).toBe('Swap to USDC on Unichain')
    expect(title).not.toContain('Swap Swap')
  })

  it('renders the resolved source symbol — "Swap UNI to USDC on Unichain"', () => {
    expect(
      stepTitle({
        step: makeStep('MARGIN_PRE_SWAP', { tokenIn: '0xAAA', tokenInChainId: UniverseChainId.Unichain }),
        t: renderT,
        tokenInSymbol: 'UNI',
        resolveSymbol,
      }),
    ).toBe('Swap UNI to USDC on Unichain')
  })

  it('prefers the resolved symbol over the resolver for a native source token', () => {
    // native 0x0 would resolve to ETH via findMarginTokenSymbol's own native check; the
    // wire-resolved symbol must still win.
    expect(
      stepTitle({
        step: makeStep('MARGIN_PRE_SWAP', {
          tokenIn: MARGIN_NATIVE_TOKEN_ADDRESS,
          tokenInChainId: UniverseChainId.Unichain,
        }),
        t: renderT,
        tokenInSymbol: 'WETH',
        resolveSymbol,
      }),
    ).toBe('Swap WETH to USDC on Unichain')
  })
})

describe('stepTitle — same-chain pre-swap', () => {
  it('renders the mainnet preSwap when both from and to resolve', () => {
    expect(
      stepTitle({
        step: makeStep('MARGIN_PRE_SWAP'),
        market: sameChainMarket,
        t: renderT,
        tokenInSymbol: 'USDC',
        resolveSymbol,
      }),
    ).toBe('Swap USDC → ETH')
  })

  it('falls back to a bare "Swap" when from/to are unresolved on the margin chain', () => {
    expect(stepTitle({ step: makeStep('MARGIN_PRE_SWAP'), t: renderT, resolveSymbol })).toBe('Swap')
  })
})

describe('stepTitle — cross-chain approval', () => {
  it('names a cross-chain approval token via the resolved symbol', () => {
    expect(
      stepTitle({
        step: makeStep('APPROVAL_TXN', { tokenIn: '0xAAA', tokenInChainId: UniverseChainId.Unichain }),
        t: renderT,
        tokenInSymbol: 'UNI',
        resolveSymbol,
      }),
    ).toBe('Approve UNI')
  })
})

describe('stepTitle — injected resolver', () => {
  it('uses the injected resolver when no tokenInSymbol was already resolved via currency-info', () => {
    const stubResolver = (address: string): string | undefined => (address === '0xTOKEN' ? 'FOO' : undefined)
    expect(
      stepTitle({
        step: makeStep('APPROVAL_TXN', { tokenIn: '0xTOKEN' }),
        t: renderT,
        resolveSymbol: stubResolver,
      }),
    ).toBe('Approve FOO')
  })
})

const NONE_MOVED = { earlierStepMoved: false, failingStepBroadcast: false }

describe('restartNote', () => {
  it('maps MAX_REMATERIALIZE_EXCEEDED to restartCouldNotPrepare — NOT the source-funds default', () => {
    expect(restartNote({ code: 'MAX_REMATERIALIZE_EXCEEDED', moved: NONE_MOVED, t: mockT })).toBe(
      'margin.plan.error.restartCouldNotPrepare',
    )
  })

  // The "sent nothing" guarantee is per-failing-attempt, not plan-wide: a cross-chain open whose bridge
  // leg completed before the open exhausted its re-materialization budget DID move funds, and they are
  // sitting in the wallet on the destination chain.
  it('names the funded copy when an earlier step already moved funds', () => {
    expect(
      restartNote({
        code: 'MAX_REMATERIALIZE_EXCEEDED',
        moved: { earlierStepMoved: true, failingStepBroadcast: false },
        t: mockT,
      }),
    ).toBe('margin.plan.error.restartCouldNotPrepareFunded')
  })

  // The evidence that set the flag must not be denied by the copy: when the FAILING step holds a proof
  // it DID broadcast, so "It sent nothing" is false. It also outranks an earlier step's move — a tx
  // that may still land is the thing the user has to act on.
  it('names the may-have-sent copy when the FAILING step broadcast, over the earlier-step copy', () => {
    expect(
      restartNote({
        code: 'MAX_REMATERIALIZE_EXCEEDED',
        moved: { earlierStepMoved: true, failingStepBroadcast: true },
        t: mockT,
      }),
    ).toBe('margin.plan.error.restartCouldNotPrepareSent')
  })

  it('maps PROOF_UNRECOVERABLE to restartCheckPosition', () => {
    expect(restartNote({ code: 'PROOF_UNRECOVERABLE', moved: NONE_MOVED, t: mockT })).toBe(
      'margin.plan.error.restartCheckPosition',
    )
  })

  // One code, two producers (the FE's bridge guard and the server's wallet-balance guard on the
  // open). Only the failing STEP separates them, and they need opposite next steps — top up the
  // source chain vs. re-quote, because an open's size came from what the pre-swap delivered.
  // A cached proof for the FAILING step says a tx exists for it, and "top up and start again" over a
  // possibly-live deposit is the one thing this note must not say. `mayClearProofsOnAbandon` already
  // treats that proof as authoritative over the code; these two must not disagree about the same fact.
  // Premise-free on purpose: this step failed a BALANCE check, so the couldNotPrepare opener ("after
  // several tries") belongs to MAX_REMATERIALIZE_EXCEEDED and would be false here — the same reason the
  // PLAN_TERMINAL arm declines to reuse it.
  it('uses a string carrying no re-materialize premise, unlike the MAX_REMATERIALIZE arm', () => {
    const sent = { earlierStepMoved: false, failingStepBroadcast: true }
    expect(restartNote({ code: 'INSUFFICIENT_SOURCE_FUNDS', stepType: 'MARGIN_OPEN', moved: sent, t: mockT })).toBe(
      'margin.plan.error.restartMayHaveSent',
    )
    expect(restartNote({ code: 'MAX_REMATERIALIZE_EXCEEDED', moved: sent, t: mockT })).toBe(
      'margin.plan.error.restartCouldNotPrepareSent',
    )
  })

  it.each(['MARGIN_BRIDGE', 'MARGIN_OPEN'] as const)(
    'refuses the top-up/re-quote copy on a %s whose failing step already broadcast',
    (stepType) => {
      expect(
        restartNote({
          code: 'INSUFFICIENT_SOURCE_FUNDS',
          stepType,
          moved: { earlierStepMoved: false, failingStepBroadcast: true },
          t: mockT,
        }),
      ).toBe('margin.plan.error.restartMayHaveSent')
    },
  )

  it('maps a BRIDGE INSUFFICIENT_SOURCE_FUNDS to restartTopUp', () => {
    expect(
      restartNote({ code: 'INSUFFICIENT_SOURCE_FUNDS', stepType: 'MARGIN_BRIDGE', moved: NONE_MOVED, t: mockT }),
    ).toBe('margin.plan.error.restartTopUp')
  })

  it('maps an OPEN INSUFFICIENT_SOURCE_FUNDS to restartRequote, never the bridge top-up copy', () => {
    expect(
      restartNote({ code: 'INSUFFICIENT_SOURCE_FUNDS', stepType: 'MARGIN_OPEN', moved: NONE_MOVED, t: mockT }),
    ).toBe('margin.plan.error.restartRequote')
  })

  // Only a bridge has a SOURCE chain to top up. An adjust or close deposit pulls from the EOA on the
  // margin chain, so the bridge copy would send the user to a chain the plan never used.
  it.each(['MARGIN_ADJUST', 'MARGIN_CLOSE', 'MARGIN_PRE_SWAP'] as const)(
    'gives %s the chain-neutral add-funds copy, never the bridge top-up',
    (stepType) => {
      expect(restartNote({ code: 'INSUFFICIENT_SOURCE_FUNDS', stepType, moved: NONE_MOVED, t: mockT })).toBe(
        'margin.plan.error.restartAddFunds',
      )
    },
  )

  // An unresolvable stepIndex (plan reshaped under the error) names no chain either — "top up the
  // source chain" over a step whose type is unknown is a claim about where the money is.
  it('stays chain-neutral when the failing step cannot be resolved', () => {
    expect(restartNote({ code: 'INSUFFICIENT_SOURCE_FUNDS', moved: NONE_MOVED, t: mockT })).toBe(
      'margin.plan.error.restartAddFunds',
    )
  })

  // The CODE is not evidence. The server stamps SOURCE_STEP_UNRECOVERABLE when a source-leg step's
  // routed calldata cannot be rebuilt from state — a property of the route, not of what was sent — and
  // its producer covers source APPROVALS and materialization-time failures, neither of which sends
  // anything. Claiming parked USDC on that alone sends the user hunting for money they never had.
  it('names parked source-chain USDC only when the failing step actually broadcast', () => {
    expect(
      restartNote({
        code: 'SOURCE_STEP_UNRECOVERABLE',
        moved: { earlierStepMoved: false, failingStepBroadcast: true },
        t: mockT,
      }),
    ).toBe('margin.plan.error.restartSourceFunds')
  })

  // An earlier step's funds are real but their LOCATION is not this arm's to name.
  it('falls back to the location-free funded copy when only an earlier step moved', () => {
    expect(
      restartNote({
        code: 'SOURCE_STEP_UNRECOVERABLE',
        moved: { earlierStepMoved: true, failingStepBroadcast: false },
        t: mockT,
      }),
    ).toBe('margin.plan.error.restartPlanEndedFunded')
  })

  it('says nothing for SOURCE_STEP_UNRECOVERABLE with no evidence anything was sent', () => {
    expect(restartNote({ code: 'SOURCE_STEP_UNRECOVERABLE', moved: NONE_MOVED, t: mockT })).toBe(undefined)
  })

  // The parked-funds copy used to be the `default`, so it asserted that funds had been SENT for any
  // code it did not recognise — including PLAN_TERMINAL, minted for a plan that reached a terminal
  // status with no failing step at all. No note is better than a wrong one; the modal skips it.
  // PLAN_TERMINAL is the only arm with nothing to say, and the union makes that checkable rather than
  // a `default` that also swallowed every unrecognised code. A code outside the terminal set can no
  // longer reach here at all — the call site gates on `isTerminalStepError`, the same predicate that
  // decides whether Restart renders, so the note and the button cannot disagree.
  // PLAN_TERMINAL carries two shapes: a plan that ended with no failing step, and the coercion of a
  // code outside the terminal set on an already-terminal plan. "Nothing to say" holds for the first;
  // for the second the money may well be somewhere, so the arm reports what it can still stand behind.
  it('speaks on PLAN_TERMINAL when funds moved, and stays quiet when they did not', () => {
    // Its OWN string: the couldNotPrepare copy opens with "we couldn't prepare this step after several
    // tries", which is specific to MAX_REMATERIALIZE_EXCEEDED and false of a plan that simply ended.
    expect(
      restartNote({ code: 'PLAN_TERMINAL', moved: { earlierStepMoved: true, failingStepBroadcast: false }, t: mockT }),
    ).toBe('margin.plan.error.restartPlanEndedFunded')
    expect(
      restartNote({ code: 'PLAN_TERMINAL', moved: { earlierStepMoved: false, failingStepBroadcast: true }, t: mockT }),
    ).toBe('margin.plan.error.restartPlanEndedFunded')
    expect(restartNote({ code: 'PLAN_TERMINAL', moved: NONE_MOVED, t: mockT })).toBeUndefined()
  })
})

// A zero-then-set allowance (USDT and friends) arrives as its own step type from the shared composer,
// passed through by the margin cross-chain route. Unmodelled, it fell to stepTitle's default arm and
// put the raw enum string on screen as the step label.
describe('stepTitle — reset approval', () => {
  const stubResolver = (address: string): string | undefined => (address === '0xTOKEN' ? 'USDT' : undefined)

  it('names the reset distinctly from the approve that follows it', () => {
    const reset = stepTitle({
      step: makeStep('RESET_APPROVAL_TXN', { tokenIn: '0xTOKEN' }),
      t: renderT,
      resolveSymbol: stubResolver,
    })
    const approve = stepTitle({
      step: makeStep('APPROVAL_TXN', { tokenIn: '0xTOKEN' }),
      t: renderT,
      resolveSymbol: stubResolver,
    })
    expect(reset).toBe('Reset USDT approval')
    expect(reset).not.toBe(approve)
  })
})

// Its own block, where someone adding a step type looks. Every type in the wire union needs an arm —
// the `default` returns the raw enum, which is the right answer for drift and the wrong one for a type
// this client knows about. The list is DERIVED from the exhaustive Record rather than hand-copied, so a
// new union member is a compile error there and an automatic case here.
describe('stepTitle — wire union coverage', () => {
  it.each(Object.keys(FUNDS_MOVING_BY_STEP_TYPE) as MarginPlanStepType[])(
    'never renders the raw wire enum as a label (%s)',
    (stepType) => {
      expect(stepTitle({ step: makeStep(stepType, {}), t: renderT, resolveSymbol: () => undefined })).not.toContain(
        stepType,
      )
    },
  )
})

// The registry can be unresolved while this sheet is up — a pointer-banner resume after a reload is
// exactly that window — and reporting an unknown side there made planTitle announce "Open long
// position" over a SHORT, on the screen about to sign it.
describe('planReviewDirection', () => {
  const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
  const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'

  it('classifies off the PLAN when the market has not resolved', () => {
    // Debt is the stable leg ⇒ LONG; collateral stable and debt volatile ⇒ SHORT.
    expect(planReviewDirection({ market: undefined, plan: { collateralToken: WETH, debtToken: USDC } })).toBe(
      MarginDirection.LONG,
    )
    expect(planReviewDirection({ market: undefined, plan: { collateralToken: USDC, debtToken: WETH } })).toBe(
      MarginDirection.SHORT,
    )
  })

  it("prefers the resolved market's own stated direction", () => {
    const market = { direction: MarginDirection.SHORT, collateral: { address: WETH }, debt: { address: USDC } }
    expect(
      planReviewDirection({
        market: market as unknown as Parameters<typeof planReviewDirection>[0]['market'],
        plan: { collateralToken: WETH, debtToken: USDC },
      }),
    ).toBe(MarginDirection.SHORT)
  })
})

describe('planMovedFunds', () => {
  // `as unknown as MarginPlanStep`, never `as never`: casting to never turns field checking OFF, so a
  // rename of stepIndex/status would leave this suite green while planMovedFunds read undefined. This
  // keeps the names checked and still admits the deliberately off-union stepType case below.
  const step = (over: { stepIndex: number; stepType: string; status: string }): MarginPlanStep =>
    over as unknown as MarginPlanStep
  const moved = (steps: MarginPlanStep[], failingStepIndex: number | undefined, failingStepHasProof = false): boolean =>
    planMovedFunds({ steps, failingStepIndex, failingStepHasProof }).earlierStepMoved

  it('reports a completed bridge leg before the failing step', () => {
    const steps = [
      step({ stepIndex: 0, stepType: 'MARGIN_BRIDGE', status: 'COMPLETE' }),
      step({ stepIndex: 1, stepType: 'MARGIN_OPEN', status: 'STEP_ERROR' }),
    ]
    expect(moved(steps, 1)).toBe(true)
  })

  // An approval authorizes a transfer without making one, so a plan that got no further has still sent
  // nothing — the unfunded copy stays correct.
  it('does not count a completed approval', () => {
    const steps = [
      step({ stepIndex: 0, stepType: 'APPROVAL_TXN', status: 'COMPLETE' }),
      step({ stepIndex: 1, stepType: 'MARGIN_OPEN', status: 'STEP_ERROR' }),
    ]
    expect(moved(steps, 1)).toBe(false)
  })

  it('does not count a funds-moving step that never completed, or one AFTER the failing step', () => {
    const steps = [
      step({ stepIndex: 0, stepType: 'MARGIN_BRIDGE', status: 'NOT_READY' }),
      step({ stepIndex: 1, stepType: 'MARGIN_PRE_SWAP', status: 'STEP_ERROR' }),
      step({ stepIndex: 2, stepType: 'MARGIN_OPEN', status: 'COMPLETE' }),
    ]
    expect(moved(steps, 1)).toBe(false)
  })

  // The case no step STATUS records: a step that broadcast, took PROOF_REVERIFY_FAILED and was
  // re-materialized until the budget ran out is COMPLETE nowhere, yet its tx may still land. Reported
  // as its OWN fact, because "an earlier step moved funds" is false and the copy must not claim it.
  it('reports the failing step broadcasting separately from an earlier step moving', () => {
    const steps = [step({ stepIndex: 0, stepType: 'MARGIN_BRIDGE', status: 'STEP_ERROR' })]
    const withProof = planMovedFunds({ steps, failingStepIndex: 0, failingStepHasProof: true })
    expect(withProof).toEqual({ earlierStepMoved: false, failingStepBroadcast: true })
  })

  // `surfaceTerminalStepError` mints a `stepIndex: 0` sentinel for a plan that died with nothing
  // stamped, and index 0 is a real index too — so the caller passes undefined and the scan covers the
  // WHOLE plan. Scanning "before 0" reported nothing moved for a plan that had moved everything.
  it('scans every step when no step carries the failure', () => {
    const steps = [
      step({ stepIndex: 0, stepType: 'MARGIN_PRE_SWAP', status: 'COMPLETE' }),
      step({ stepIndex: 1, stepType: 'MARGIN_BRIDGE', status: 'COMPLETE' }),
    ]
    expect(moved(steps, undefined)).toBe(true)
    expect(moved(steps, 0)).toBe(false)
  })

  // A wire stepType outside the client union indexes to undefined; reading that as "sent nothing" is
  // the fail-OPEN direction on a funds question, and the Record's exhaustiveness cannot bind the wire.
  it('treats an unknown wire step type as funds-moving', () => {
    const steps = [step({ stepIndex: 0, stepType: 'MARGIN_SOMETHING_NEW', status: 'COMPLETE' })]
    expect(moved(steps, undefined)).toBe(true)
  })
})

// Both facts here have been got wrong once each, in opposite directions — hence one tested resolver.
describe('resolveRestartSubject', () => {
  const step = (over: Record<string, unknown>): MarginPlanStep => over as unknown as MarginPlanStep

  // The regression this replaced: a client-minted failure (the wallet-funded open's balance check)
  // writes only the store's stepError and leaves the SERVER step AWAITING_ACTION. Filtering on
  // STEP_ERROR lost the stepType, and the note then told the user to top up a source chain they never
  // used instead of re-quoting.
  it('keeps the step type for a client-minted failure, whose server step is still AWAITING_ACTION', () => {
    const steps = [
      step({ stepIndex: 0, stepType: 'MARGIN_PRE_SWAP', status: 'COMPLETE' }),
      step({ stepIndex: 1, stepType: 'MARGIN_OPEN', status: 'AWAITING_ACTION' }),
    ]
    expect(resolveRestartSubject({ steps, stepError: { stepIndex: 1, code: 'INSUFFICIENT_SOURCE_FUNDS' } })).toEqual({
      stepType: 'MARGIN_OPEN',
      failingStepIndex: 1,
    })
  })

  // The sentinel is minted with stepIndex 0, which is also a real index — so the discriminator is
  // whether ANY step carries failure evidence, not the number.
  it('reports no failing step for the PLAN_TERMINAL sentinel, so the funds scan covers the whole plan', () => {
    const steps = [
      step({ stepIndex: 0, stepType: 'MARGIN_PRE_SWAP', status: 'COMPLETE' }),
      step({ stepIndex: 1, stepType: 'MARGIN_BRIDGE', status: 'COMPLETE' }),
    ]
    expect(resolveRestartSubject({ steps, stepError: { stepIndex: 0, code: 'PLAN_TERMINAL' } })).toEqual({
      // The TYPE goes with the index. The sentinel's stepIndex is a placeholder that names no step, so
      // resolving a type from it hands back step 0's — inert only while PLAN_TERMINAL reads no type.
      stepType: undefined,
      failingStepIndex: undefined,
    })
  })

  // The OTHER placeholder, recognised by the flag rather than the code: a wrong-account error or a
  // create/resume failure carries `stepIndex: 0` having failed nothing on step 0. A code test cannot
  // catch these — create and resume forward the server's own errorCode verbatim, so the code may be
  // anything at all, including one that also names a step elsewhere.
  it.each([
    ['WRONG_ACCOUNT', 'WRONG_ACCOUNT'],
    ['a resume failure', 'PLAN_RESUME_FAILED'],
    ['a server code forwarded verbatim', 'PRICE_DRIFT'],
  ])('reports no failing step for a plan-level error (%s)', (_label, code) => {
    const steps = [
      step({ stepIndex: 0, stepType: 'APPROVAL_PERMIT', status: 'AWAITING_ACTION' }),
      step({ stepIndex: 1, stepType: 'MARGIN_OPEN', status: 'NOT_READY' }),
    ]
    expect(resolveRestartSubject({ steps, stepError: { stepIndex: 0, code, namesStep: false } })).toEqual({
      stepType: undefined,
      failingStepIndex: undefined,
    })
  })

  // Without the flag the same code still names its step — the flag is what carries the fact, not the
  // code, so an unflagged error must be unaffected.
  it('keeps the named step for the same code with no plan-level flag', () => {
    const steps = [step({ stepIndex: 0, stepType: 'APPROVAL_PERMIT', status: 'AWAITING_ACTION' })]
    expect(resolveRestartSubject({ steps, stepError: { stepIndex: 0, code: 'PRICE_DRIFT' } })).toEqual({
      stepType: 'APPROVAL_PERMIT',
      failingStepIndex: 0,
    })
  })

  // The other half of that discriminator, through the SAME predicate the executor mints the sentinel
  // from (`erroredStep`): a real index-0 failure must keep its index, or `resolveFailingStepProof`
  // switches to the plan-wide scan and attributes another step's proof to this one.
  it.each([
    ['a STEP_ERROR status', { stepIndex: 0, stepType: 'MARGIN_OPEN', status: 'STEP_ERROR' } as const],
    ['an errorCode alone', { stepIndex: 0, stepType: 'MARGIN_OPEN', errorCode: 'PROOF_UNRECOVERABLE' } as const],
  ])('keeps index 0 when the plan carries %s', (_label, failing) => {
    const steps = [step(failing), step({ stepIndex: 1, stepType: 'MARGIN_BRIDGE', status: 'AWAITING_ACTION' })]
    expect(resolveRestartSubject({ steps, stepError: { stepIndex: 0, code: 'PLAN_TERMINAL' } }).failingStepIndex).toBe(
      0,
    )
  })

  it('keeps index 0 when a real failure sits there', () => {
    const steps = [step({ stepIndex: 0, stepType: 'MARGIN_BRIDGE', status: 'STEP_ERROR' })]
    expect(resolveRestartSubject({ steps, stepError: { stepIndex: 0, code: 'PLAN_TERMINAL' } }).failingStepIndex).toBe(
      0,
    )
  })

  // A coerced PLAN_TERMINAL on a plan whose step carries an errorCode is NOT the sentinel.
  it('keeps the index when a step carries an errorCode without STEP_ERROR status', () => {
    const steps = [step({ stepIndex: 0, stepType: 'MARGIN_OPEN', status: 'NOT_READY', errorCode: 'PRICE_DRIFT' })]
    expect(resolveRestartSubject({ steps, stepError: { stepIndex: 0, code: 'PLAN_TERMINAL' } }).failingStepIndex).toBe(
      0,
    )
  })
})

// One predicate behind all three broadcast checks — the plan-wide scan, the failing-step read, and the
// earlier-step scan. They answer the same question and had already drifted apart once: the plan-wide
// half filtered approvals out while the failing-step half counted them, so a terminal error on an
// already-broadcast APPROVAL_TXN reported that a transaction may have moved funds.
describe('stepTypeMovesFunds', () => {
  it.each([
    'MARGIN_PRE_SWAP',
    'MARGIN_OPEN',
    'MARGIN_CLOSE',
    'MARGIN_BRIDGE',
    'MARGIN_RECOVER',
    'MARGIN_ADJUST',
  ] as const)('counts %s', (stepType) => {
    expect(stepTypeMovesFunds(stepType)).toBe(true)
  })

  // An approval authorizes a transfer without making one — it broadcasts, and writes a proof, having
  // moved nothing.
  it.each(['APPROVAL_TXN', 'RESET_APPROVAL_TXN', 'APPROVAL_PERMIT'] as const)('does NOT count %s', (stepType) => {
    expect(stepTypeMovesFunds(stepType)).toBe(false)
  })

  // Fail-SAFE on a funds question: an unrecognised wire type, or a step the plan no longer names,
  // counts as moving rather than as "sent nothing".
  it('counts an unknown wire type and an unresolvable step', () => {
    expect(stepTypeMovesFunds('MARGIN_SOMETHING_NEW' as unknown as MarginPlanStepType)).toBe(true)
    expect(stepTypeMovesFunds(undefined)).toBe(true)
  })
})

// The WIRING, not the pure functions it feeds. `restartNote`/`planMovedFunds` are pinned above with
// `moved` handed in directly, so nothing there covers the branch that decides whether the user is told
// a transaction may be live — and that branch has been wrong twice.
describe('resolveFailingStepProof', () => {
  const SWAPPER = '0x1111111111111111111111111111111111111111'
  const PLAN_ID = 'plan-proof-1'

  function planWith(steps: readonly MarginPlanStep[]): MarginPlanResponse {
    return {
      planId: PLAN_ID,
      swapper: SWAPPER,
      status: 'IN_PROGRESS',
      currentStepIndex: 0,
      steps: [...steps],
    } as MarginPlanResponse
  }

  function indexedStep(stepIndex: number, stepType: MarginPlanStepType): MarginPlanStep {
    return { ...makeStep(stepType), stepIndex }
  }

  function proveStep(stepIndex: number): void {
    writeStepProof({ swapper: SWAPPER, planId: PLAN_ID, stepIndex, txHash: '0xhash', to: '0xto', data: '0x' })
  }

  // BOTH stores, or a case leaks: the reset helper clears the in-memory backup only, and readMap merges
  // localStorage over it — so a proof one case wrote is still readable by the next.
  beforeEach(() => {
    localStorage.clear()
    __resetMemoryProofsForTest()
  })

  it('reports a named funds-moving step that broadcast', () => {
    const plan = planWith([indexedStep(0, 'APPROVAL_TXN'), indexedStep(1, 'MARGIN_OPEN')])
    proveStep(1)
    expect(resolveFailingStepProof({ plan, subject: { stepType: 'MARGIN_OPEN', failingStepIndex: 1 } })).toBe(true)
  })

  it('reports nothing for a named funds-moving step with no proof', () => {
    const plan = planWith([indexedStep(0, 'MARGIN_OPEN')])
    expect(resolveFailingStepProof({ plan, subject: { stepType: 'MARGIN_OPEN', failingStepIndex: 0 } })).toBe(false)
  })

  // An approval broadcasts and writes a proof having moved nothing — reading its proof ungated is what
  // told the user a transaction may have moved funds on a plan that only ever approved.
  it('does NOT report a named APPROVAL step that broadcast', () => {
    const plan = planWith([indexedStep(0, 'APPROVAL_TXN')])
    proveStep(0)
    expect(resolveFailingStepProof({ plan, subject: { stepType: 'APPROVAL_TXN', failingStepIndex: 0 } })).toBe(false)
  })

  // The sentinel names no step, so an index read would find nothing — the plan-wide scan is the only
  // thing that sees a broadcast the server never stamped.
  it('scans the whole plan when no step is named', () => {
    const plan = planWith([indexedStep(0, 'APPROVAL_TXN'), indexedStep(1, 'MARGIN_BRIDGE')])
    proveStep(1)
    expect(resolveFailingStepProof({ plan, subject: { failingStepIndex: undefined } })).toBe(true)
  })

  it('ignores an approval-only broadcast on the plan-wide scan', () => {
    const plan = planWith([indexedStep(0, 'APPROVAL_TXN'), indexedStep(1, 'MARGIN_BRIDGE')])
    proveStep(0)
    expect(resolveFailingStepProof({ plan, subject: { failingStepIndex: undefined } })).toBe(false)
  })

  // Fail-safe on a funds claim: a step type this client doesn't know still counts as having moved.
  it('counts a named step of an unknown wire type', () => {
    const plan = planWith([indexedStep(0, 'MARGIN_OPEN')])
    proveStep(0)
    const stepType = 'MARGIN_SOMETHING_NEW' as unknown as MarginPlanStepType
    expect(resolveFailingStepProof({ plan, subject: { stepType, failingStepIndex: 0 } })).toBe(true)
  })
})

// A client-minted failure writes only the store's `stepError` — the SERVER step keeps whatever status
// it had. Without reading that error the row renders live under a plan the red message calls dead.
describe('toStepStatus', () => {
  const plan = {
    planId: 'p1',
    swapper: '0x2222222222222222222222222222222222222222',
    status: 'IN_PROGRESS',
    currentStepIndex: 0,
    steps: [{ ...makeStep('MARGIN_OPEN'), stepIndex: 0 }],
  } as MarginPlanResponse
  const step = plan.steps[0] as MarginPlanStep

  it('renders Failed for the step a client-minted error names', () => {
    expect(toStepStatus({ step, plan, failingStepIndex: 0, isWalletPromptOpen: false })).toBe(StepStatus.Failed)
  })

  it('renders Active for that same step with no error', () => {
    expect(toStepStatus({ step, plan, failingStepIndex: undefined, isWalletPromptOpen: false })).toBe(StepStatus.Active)
  })

  it('leaves a step the error does not name alone', () => {
    expect(toStepStatus({ step, plan, failingStepIndex: 1, isWalletPromptOpen: false })).toBe(StepStatus.Active)
  })

  // Server truth wins for every status but AWAITING_ACTION. The stall bails and runLoop's catch name
  // `currentStepIndex` with no status check, so a CLIENT_ERROR lands on whatever step is current — and
  // striking out an IN_PROGRESS bridge would call a broadcast deposit awaiting fill dead.
  it.each([
    ['COMPLETE', StepStatus.Complete],
    ['IN_PROGRESS', StepStatus.InProgress],
  ] as const)('leaves a %s step on its server status', (status, expected) => {
    const other = { ...step, status } as MarginPlanStep
    const otherPlan = { ...plan, steps: [other] } as MarginPlanResponse
    expect(toStepStatus({ step: other, plan: otherPlan, failingStepIndex: 0, isWalletPromptOpen: false })).toBe(
      expected,
    )
  })

  // Both consumers off ONE resolution. A plan that died with nothing stamped mints a placeholder
  // `stepIndex: 0` that names no step — backing out of the sheet before signing is exactly that — and
  // taking it literally strikes out row 0 for a step nothing failed on while the note below says
  // nothing specific. `resolveRestartSubject` is what turns that placeholder into undefined.
  // A step that already broadcast is one the SERVER is verifying, and the BE can leave it
  // AWAITING_ACTION while it does. The verification poll has a finite budget and throws when it runs
  // out; runLoop's catch then mints CLIENT_ERROR on `firstActionableStep` — that very step. Striking
  // it out badges a live on-chain transaction as failed.
  it('leaves a step that already broadcast in progress, even when the error names it', () => {
    const broadcast = { ...step, proof: { txHash: '0xabc' } } as unknown as MarginPlanStep
    const broadcastPlan = { ...plan, steps: [broadcast] } as MarginPlanResponse
    expect(toStepStatus({ step: broadcast, plan: broadcastPlan, failingStepIndex: 0, isWalletPromptOpen: false })).toBe(
      StepStatus.InProgress,
    )
  })

  it('leaves row 0 alone for a plan that died with no step stamped', () => {
    const cancelled = { ...plan, status: 'CANCELLED' } as MarginPlanResponse
    const { failingStepIndex } = resolveRestartSubject({
      steps: cancelled.steps,
      stepError: { stepIndex: 0, code: 'PLAN_TERMINAL' },
    })
    expect(toStepStatus({ step, plan: cancelled, failingStepIndex, isWalletPromptOpen: false })).toBe(StepStatus.Active)
  })
})
