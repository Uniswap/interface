/* oxlint-disable max-lines -- the file is one screen plus the pure functions that decide what it says:
   the step-row status map, the step and plan titles, the restart-note taxonomy and the two predicates
   behind it. They are exported and unit-tested precisely so this component stays a wiring layer, and
   they belong beside the modal that is their only consumer — moving them out to satisfy a line count
   would put the copy decisions a file away from the surface that renders them. */
import { useQueryClient } from '@tanstack/react-query'
import { normalizeTokenAddressForCache } from '@universe/chains'
import { Flex, Text } from '@universe/mycelium'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { Button, Separator } from 'ui/src'
import { Approve } from 'ui/src/components/icons/Approve'
import { SpinningLoader } from 'ui/src/loading/SpinningLoader'
import { StepRowSkeleton } from 'uniswap/src/components/ConfirmSwapModal/steps/StepRowSkeleton'
import { StepStatus } from 'uniswap/src/components/ConfirmSwapModal/types'
import { Modal } from 'uniswap/src/components/modals/Modal'
import {
  MARGIN_NATIVE_TOKEN_ADDRESS,
  type MarginPlanResponse,
  type MarginPlanStep,
  type MarginPlanStepType,
  type MarginTxStepPayload,
} from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { MARGIN_POSITIONS_QUERY_KEY } from 'uniswap/src/data/apiClients/tradingApi/useMarginPositionsQuery'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import type { MarginDirection } from 'uniswap/src/features/transactions/margin/types'
import { useEvent } from 'utilities/src/react/hooks'
import { MARGIN_CHAIN_ID, type MarginMarket } from '~/constants/margin'
import { useAccount } from '~/hooks/useAccount'
import {
  erroredStep,
  firstActionableStep,
  isPlanForAccount,
  isTerminalPlanStatus,
  isTerminalStepError,
  type MarginTerminalStepErrorCode,
} from '~/pages/Swap/Margin/hooks/marginExecutionGuards'
import { useMarginPlanExecution } from '~/pages/Swap/Margin/hooks/marginPlanExecutionStore'
import { planHasProofForSteps, readStepProof } from '~/pages/Swap/Margin/hooks/marginStepProofCache'
import { useExecuteMarginPlan } from '~/pages/Swap/Margin/hooks/useExecuteMarginPlan'
import { findMarginTokenInfoInMarkets, useMarginMarkets } from '~/pages/Swap/Margin/hooks/useMarginMarkets'
import { marginStepTokenInCurrencyId } from '~/pages/Swap/Margin/marginCurrencies'
import { marginChainName } from '~/pages/Swap/Margin/marginRouteText'
import {
  marginMarketDirection,
  marginPairLabel,
  marginUnwrapSymbol,
  type MarginSymbolResolver,
} from '~/pages/Swap/Margin/marginTokenDisplay'

export function toStepStatus({
  step,
  plan,
  failingStepIndex,
  isWalletPromptOpen,
}: {
  step: MarginPlanStep
  plan: MarginPlanResponse
  // From `resolveRestartSubject`, not the raw `stepError.stepIndex`: the sentinel a plan that died with
  // nothing stamped mints carries a placeholder 0 that names no step, and striking out row 0 for it
  // would blame a step nothing failed on — a CANCELLED plan backed out of before signing is exactly
  // that. One resolution, so the struck row and the restart note name the same step.
  failingStepIndex: number | undefined
  isWalletPromptOpen: boolean
}): StepStatus {
  // A client-minted failure is the same failure the red message and Restart below describe, and the
  // server step it names keeps its own status: the wallet-funded open's pre-broadcast balance guard
  // leaves it AWAITING_ACTION with no proof, which reads as Active — a live row under a dead plan.
  //
  // AWAITING_ACTION only, as an allowlist. Every other status is a server claim about work already
  // under way, and the stall bails name `currentStepIndex` without checking it: a CLIENT_ERROR over an
  // IN_PROGRESS MARGIN_BRIDGE would strike out a deposit that is broadcast and awaiting fill. A status
  // this client does not know about stays un-struck for the same reason.
  // `!step.proof` is half the premise above, not a detail: a step that already broadcast is one the
  // server is verifying, and the BE can leave it AWAITING_ACTION while it does. The verification poll
  // has a finite budget and throws when it runs out, and runLoop's catch mints CLIENT_ERROR on
  // `firstActionableStep` — i.e. on that very step. Striking it out would badge a live on-chain
  // transaction as failed, which is exactly the state that makes a user open a second position.
  if (step.status === 'AWAITING_ACTION' && !step.proof && failingStepIndex === step.stepIndex) {
    return StepStatus.Failed
  }
  switch (step.status) {
    case 'COMPLETE':
      return StepStatus.Complete
    case 'STEP_ERROR':
      return StepStatus.Failed
    case 'IN_PROGRESS':
      return StepStatus.InProgress
    case 'AWAITING_ACTION': {
      // Through the executor's own predicate: this row marks Active exactly the step the loop is about
      // to prompt for, and a second copy of that rule is one the two can drift apart on.
      const isFirstActionable = firstActionableStep(plan)?.stepIndex === step.stepIndex
      if (!isFirstActionable) {
        return StepStatus.Preview
      }
      // Proof submitted → server verifying reads as in-progress; wallet prompt open reads as active.
      return isWalletPromptOpen || !step.proof ? StepStatus.Active : StepStatus.InProgress
    }
    default:
      return StepStatus.Preview
  }
}

// Wire tokens resolve through the injected resolver; the native address always maps to ETH.
function findMarginTokenSymbol({
  address,
  resolveSymbol,
}: {
  address?: string
  resolveSymbol: MarginSymbolResolver
}): string | undefined {
  if (!address) {
    return undefined
  }
  const lower = normalizeTokenAddressForCache(address)
  if (lower === MARGIN_NATIVE_TOKEN_ADDRESS) {
    return 'ETH'
  }
  return resolveSymbol(address)
}

// Static literal per intent — a template-interpolated key would get stripped by i18n:extract.
/**
 * Which side this plan opens, for the sheet's own title.
 *
 * Falls back to the PLAN's own token addresses rather than reporting undefined: the markets registry
 * may not have resolved while this modal is up — a pointer-banner resume after a reload is exactly that
 * window — and `planTitle`'s undefined arm reads "Open long position", announcing the wrong side of a
 * SHORT on the screen that is about to sign it. The plan carries the addresses the classifier needs, so
 * there is no state in which the side is genuinely unknowable.
 */
export function planReviewDirection({
  market,
  plan,
}: {
  market: MarginMarket | undefined
  plan: Pick<MarginPlanResponse, 'collateralToken' | 'debtToken'>
}): MarginDirection {
  return (
    market?.direction ??
    marginMarketDirection({
      collateralToken: market?.collateral.address ?? plan.collateralToken,
      debtToken: market?.debt.address ?? plan.debtToken,
    })
  )
}

export function planTitle({
  intent,
  direction,
  t,
}: {
  intent: MarginPlanResponse['intent']
  direction: MarginDirection | undefined
  t: TFunction
}): string {
  switch (intent) {
    case 'OPEN':
      return direction === 'SHORT' ? t('margin.cta.openShort') : t('margin.plan.title.open')
    case 'CLOSE':
      return t('margin.plan.title.close')
    case 'ADJUST':
      return t('margin.plan.title.adjust')
    default:
      // Unreachable for the closed union (lint needs it); raw value beats a crash on wire drift.
      return intent
  }
}

// Exhaustive over the wire union, so a step type added later is a COMPILE error rather than a copy
// decision made by omission — the same drift the union-typed `code` above closes.
//
// Approvals are false on purpose: an APPROVAL_TXN, RESET_APPROVAL_TXN or APPROVAL_PERMIT authorizes a
// transfer without making one, so a plan that got no further than approving has still sent nothing.
export const FUNDS_MOVING_BY_STEP_TYPE: Record<MarginPlanStepType, boolean> = {
  APPROVAL_TXN: false,
  RESET_APPROVAL_TXN: false,
  APPROVAL_PERMIT: false,
  MARGIN_PRE_SWAP: true,
  MARGIN_OPEN: true,
  MARGIN_CLOSE: true,
  MARGIN_BRIDGE: true,
  MARGIN_RECOVER: true,
  MARGIN_ADJUST: true,
}

/** What this plan has already moved — kept as two separate facts, because they need different copy. */
export interface MarginMovedFunds {
  // An EARLIER funds-moving step completed. "It sent nothing, but an earlier step already moved funds."
  earlierStepMoved: boolean
  // The FAILING step itself broadcast. No step STATUS records this — a re-materialized step is COMPLETE
  // nowhere — so a cached proof is the only local evidence, and saying "it sent nothing" here denies it.
  failingStepBroadcast: boolean
}

/**
 * `failingStepIndex` is undefined when NO step carries the failure: `surfaceTerminalStepError` mints a
 * `stepIndex: 0` sentinel for a plan that died with nothing stamped (a CANCELLED plan, or a FAILED one
 * the server left unmarked). Scanning "before index 0" is vacuous there, so a cross-chain open whose
 * pre-swap and bridge both COMPLETEd before the plan died reported nothing moved — the exact case the
 * note exists for. Undefined scans the WHOLE plan instead.
 */
export function planMovedFunds({
  steps,
  failingStepIndex,
  failingStepHasProof,
}: {
  steps: readonly MarginPlanStep[]
  failingStepIndex: number | undefined
  failingStepHasProof: boolean
}): MarginMovedFunds {
  return {
    earlierStepMoved: steps.some(
      (step) =>
        (failingStepIndex === undefined || step.stepIndex < failingStepIndex) &&
        step.status === 'COMPLETE' &&
        stepTypeMovesFunds(step.stepType),
    ),
    failingStepBroadcast: failingStepHasProof,
  }
}

/**
 * Whether a step of this type MOVES value when it broadcasts.
 *
 * `!== false` rather than truthiness: a wire `stepType` outside the client union indexes to undefined,
 * and reading that as "sent nothing" is the fail-OPEN direction on a funds question. Shared by both
 * halves of the broadcast check — the plan-wide scan and the failing-step read — because they answer
 * the same question and must answer it the same way.
 */
export function stepTypeMovesFunds(stepType: MarginPlanStepType | undefined): boolean {
  return stepType === undefined || FUNDS_MOVING_BY_STEP_TYPE[stepType] !== false
}

/**
 * Which step a restart note is ABOUT — the two facts the note's arms read, resolved in one place
 * because both have been got wrong here.
 *
 * `stepType` is looked up by INDEX with no status filter: a client-minted failure (the wallet-funded
 * open's pre-broadcast balance check) writes only the store's `stepError` and leaves the SERVER step
 * `AWAITING_ACTION`, so filtering on `STEP_ERROR` loses its type — and the note reads that to tell a
 * MARGIN_OPEN's re-quote from a bridge top-up, i.e. it would send the user to top up a source chain
 * they never used.
 *
 * `failingStepIndex` is undefined only for `surfaceTerminalStepError`'s no-failing-step sentinel, which
 * is minted with a `stepIndex` of 0 — a real index too, so the presence of ANY failure evidence in the
 * plan is what separates them, not the number. Undefined makes the funds scan cover the whole plan.
 */
export function resolveRestartSubject({
  steps,
  stepError,
}: {
  steps: readonly MarginPlanStep[]
  stepError: { stepIndex: number; code: string; namesStep?: false } | undefined
}): { stepType?: MarginPlanStepType; failingStepIndex: number | undefined } {
  if (stepError === undefined) {
    return { failingStepIndex: undefined }
  }
  // TWO kinds of placeholder index, recognised two ways because they are minted two ways.
  //
  // A plan-level failure (wrong account, a create or resume that never got a plan back) is ALWAYS
  // step-less, and says so on the error — a code test could not do it, since create and resume forward
  // the server's own errorCode verbatim and it may name anything.
  //
  // The PLAN_TERMINAL sentinel is minted CONDITIONALLY, only where the executor found no failing step,
  // so the code alone does not settle it: PLAN_TERMINAL also covers a real step whose non-terminal code
  // was coerced. That one goes through the executor's own predicate rather than a copy of its rule — a
  // copy would let a real index-0 failure read as the sentinel, flipping `resolveFailingStepProof` to
  // the plan-wide scan and attributing another step's proof to this one.
  const namesNoStep =
    stepError.namesStep === false || (stepError.code === 'PLAN_TERMINAL' && erroredStep(steps) === undefined)
  if (namesNoStep) {
    // Both facts leave together. The placeholder is a real index, so resolving a type from it reports
    // step 0's — and the row consumer would strike out step 0 for a step nothing failed on.
    return { failingStepIndex: undefined }
  }
  return {
    stepType: steps.find((s) => s.stepIndex === stepError.stepIndex)?.stepType,
    failingStepIndex: stepError.stepIndex,
  }
}

/**
 * Did the FAILING step itself broadcast? No step STATUS records that — a re-materialized step that
 * already sent is COMPLETE nowhere — so its cached proof is the only local evidence.
 *
 * Index-keyed where a step is named, plan-wide where none is: the sentinel path names no step, so an
 * index read would skip the evidence entirely, and that is exactly the state (broadcast, never PATCHed,
 * nothing stamped COMPLETE) where the cached hash is all there is.
 *
 * FUNDS-MOVING steps only, on BOTH branches. Every SEND_TX writes a proof, approvals included, and an
 * approval authorizes a transfer without making one, so counting it tells the user funds moved on a
 * plan that only ever broadcast an approve. An unrecognised wire type still counts: fail-safe on a
 * funds claim.
 *
 * Deliberately narrower than the executor's ungated proof read. "May this step's cached proof be
 * dropped" and "did this step move funds" are different questions, and an approval answers yes to the
 * first and no to the second.
 */
export function resolveFailingStepProof({
  plan,
  subject,
}: {
  plan: MarginPlanResponse
  subject: { stepType?: MarginPlanStepType; failingStepIndex: number | undefined }
}): boolean {
  const { swapper, planId } = plan
  if (subject.failingStepIndex === undefined) {
    return planHasProofForSteps({
      swapper,
      planId,
      stepIndexes: plan.steps.filter((step) => stepTypeMovesFunds(step.stepType)).map((step) => step.stepIndex),
    })
  }
  return (
    stepTypeMovesFunds(subject.stepType) &&
    readStepProof({ swapper, planId, stepIndex: subject.failingStepIndex }) !== undefined
  )
}

// Terminal-code Restart copy: the funds implication differs by code.
//  - PROOF_UNRECOVERABLE: a MAINNET step whose broadcast tx may have already succeeded despite failing
//    re-verification — the user must check their positions before restarting.
//  - INSUFFICIENT_SOURCE_FUNDS: nothing was sent either way, so "funds already sent" would misdirect
//    the user to look for money that never moved. One code, several producers with different next
//    steps, and only the FAILING STEP separates them — client- and server-originated alike stamp it.
//    Today the sole producer is this client's own pre-broadcast balance guard, which runs on
//    MARGIN_OPEN only; the wire contract carries the code for every step type, so the arms below cover
//    the server producers ahead of them rather than assuming the open is the only one.
//  - MAX_REMATERIALIZE_EXCEEDED: the server gave up re-materializing this step — no tx was ever
//    broadcast for the FAILING ATTEMPT. That guarantee is per-step, not plan-wide: a cross-chain open
//    whose MARGIN_BRIDGE leg completed first did move funds, and they are sitting in the wallet on the
//    destination chain. `moved` picks the honest arm of the three. The funded copy names no
//    LOCATION on purpose: the commonest route into it is a source-chain MARGIN_PRE_SWAP completing and
//    the MARGIN_BRIDGE then exhausting, which leaves the money as source-chain USDC — so "moved to your
//    wallet" would send the user to look on the wrong chain. SOURCE_STEP_UNRECOVERABLE names the chain
//    because that arm knows which step broadcast; this one does not.
//  - SOURCE_STEP_UNRECOVERABLE (default): says NOTHING about a broadcast. The server stamps it because
//    a source-leg step's routed calldata cannot be rebuilt from state, so it keeps the payload and
//    terminalizes rather than resetting — a property of the ROUTE, not of what was sent. Its producer
//    covers source approvals and materialization-time failures alike, so the arm reads `moved` for the
//    funds claim exactly like the others.

export function restartNote({
  code,
  stepType,
  moved,
  t,
}: {
  // The terminal set, not a bare string: the Restart branch is gated on `isTerminalStepError`, so a
  // sixth code added there would otherwise get a Restart button with no note and no compile error —
  // and the deliberate `PLAN_TERMINAL → undefined` case would be indistinguishable from an oversight.
  code: MarginTerminalStepErrorCode
  stepType?: MarginPlanStepType
  // The two facts kept apart, because they need different copy: "an earlier step moved funds" and "this
  // step may itself have sent". Collapsing them let the funded copy say "It sent nothing" over the very
  // evidence — a cached proof for the failing step — that had selected it.
  moved: MarginMovedFunds
  t: TFunction
}): string | undefined {
  switch (code) {
    case 'PROOF_UNRECOVERABLE':
      return t('margin.plan.error.restartCheckPosition')
    case 'INSUFFICIENT_SOURCE_FUNDS':
      // Evidence first, same order as MAX_REMATERIALIZE_EXCEEDED below. A cached proof for the failing
      // step says a tx exists for it, and "top up and start again" over a possibly-live deposit is the
      // one thing this note must not say — `mayClearProofsOnAbandon` already treats that same proof as
      // authoritative over the code, so the two would otherwise disagree about the same fact.
      // The premise-free string: this step failed a BALANCE check, so "we couldn't prepare it after
      // several tries" — which belongs to MAX_REMATERIALIZE_EXCEEDED — would be false here. Only the
      // actionable half carries over.
      if (moved.failingStepBroadcast) {
        return t('margin.plan.error.restartMayHaveSent')
      }
      // Per step type, because the next step differs and only one of them has a chain to name. An open
      // is sized against the collateral the quote saw, so it needs a fresh quote rather than a resize
      // down to what remains — and the copy asserts nothing about HOW that collateral got there: the
      // same check fires for a plain wallet-funded open with no pre-swap leg at all. A bridge really
      // was short on its SOURCE chain, so naming it is the actionable half. Everything else pulls from
      // the EOA on the margin chain, where "top up the source chain" names a chain the plan never used.
      switch (stepType) {
        case 'MARGIN_OPEN':
          return t('margin.plan.error.restartRequote')
        case 'MARGIN_BRIDGE':
          return t('margin.plan.error.restartTopUp')
        default:
          return t('margin.plan.error.restartAddFunds')
      }
    case 'MAX_REMATERIALIZE_EXCEEDED':
      // Ordered by what the user has to act on. A tx this step may have sent outranks funds an earlier
      // step moved, and "it sent nothing" is only sayable when neither is true.
      if (moved.failingStepBroadcast) {
        return t('margin.plan.error.restartCouldNotPrepareSent')
      }
      return moved.earlierStepMoved
        ? t('margin.plan.error.restartCouldNotPrepareFunded')
        : t('margin.plan.error.restartCouldNotPrepare')
    case 'SOURCE_STEP_UNRECOVERABLE':
      // Evidence-gated like every other arm, because the CODE is not evidence. The server stamps it
      // when a source-leg step's calldata is not REBUILDABLE — its own producer covers approvals and
      // materialization-time failures, neither of which sends anything — so "funds already sent" on the
      // strength of the code alone names a token and a chain the user may never have touched.
      // Only a cached proof for the failing step can carry that claim; `stepTypeMovesFunds` keeps an
      // approval's own proof from counting. The source pre-swap's output IS the bridged USDC, so where
      // the claim holds, naming it is the actionable half.
      if (moved.failingStepBroadcast) {
        return t('margin.plan.error.restartSourceFunds')
      }
      return moved.earlierStepMoved ? t('margin.plan.error.restartPlanEndedFunded') : undefined
    // PLAN_TERMINAL carries TWO shapes: a plan that reached a terminal status with no failing step at
    // all (a CANCELLED plan carries none), and `surfaceTerminalStepError`'s coercion of a code outside
    // this set on an already-terminal plan. "Nothing specific to say" is true of the first and not
    // always of the second — a cross-chain open whose pre-swap completed has money somewhere — so the
    // arm reports what it can still stand behind: that funds moved, when they did.
    case 'PLAN_TERMINAL':
      // Its own copy: the couldNotPrepare strings open with "we couldn't prepare this step after several
      // tries", which is specific to MAX_REMATERIALIZE_EXCEEDED and false of a plan that simply ended.
      return moved.earlierStepMoved || moved.failingStepBroadcast
        ? t('margin.plan.error.restartPlanEndedFunded')
        : undefined
    default: {
      // No silent fallthrough: the union makes an unhandled code a COMPILE error, which is the whole
      // point of typing `code` over the set.
      const unhandled: never = code
      return unhandled
    }
  }
}

export function stepTitle({
  step,
  market,
  t,
  tokenInSymbol,
  resolveSymbol,
}: {
  step: MarginPlanStep
  market?: MarginMarket
  t: TFunction
  tokenInSymbol?: string
  resolveSymbol: MarginSymbolResolver
}): string {
  switch (step.stepType) {
    case 'APPROVAL_TXN': {
      // Prefer the resolved source symbol so a cross-chain approval names its token too.
      const symbol = tokenInSymbol ?? findMarginTokenSymbol({ address: step.tokenIn, resolveSymbol })
      return t('margin.plan.step.approve', { symbol: symbol ?? '' }).trim()
    }
    // The approve-to-zero half of a zero-then-set allowance (USDT and friends). Named distinctly rather
    // than reusing the approve copy: the two steps run back to back, and two identical "Approve USDT"
    // rows read as a duplicate rather than as the two halves this token requires.
    case 'RESET_APPROVAL_TXN': {
      const symbol = tokenInSymbol ?? findMarginTokenSymbol({ address: step.tokenIn, resolveSymbol })
      return t('margin.plan.step.resetApproval', { symbol: symbol ?? '' }).trim()
    }
    case 'APPROVAL_PERMIT':
      return t('margin.plan.step.permit')
    case 'MARGIN_PRE_SWAP': {
      const payloadChainId = (step.payload as MarginTxStepPayload | undefined)?.chainId
      const swapChainId = step.tokenInChainId ?? payloadChainId ?? MARGIN_CHAIN_ID
      // Source-chain pre-swap: X → bridgeable USDC on the source chain, chain-named.
      if (swapChainId !== MARGIN_CHAIN_ID) {
        const fromSymbol = tokenInSymbol ?? findMarginTokenSymbol({ address: step.tokenIn, resolveSymbol })
        // Named when resolved; from-less fallback otherwise so we never emit "Swap Swap …".
        return fromSymbol
          ? t('margin.plan.step.preSwapOnChain', { from: fromSymbol, to: 'USDC', chain: marginChainName(swapChainId) })
          : t('margin.plan.step.swapToOnChain', { to: 'USDC', chain: marginChainName(swapChainId) })
      }
      const from = tokenInSymbol ?? findMarginTokenSymbol({ address: step.tokenIn, resolveSymbol })
      const to = market ? marginUnwrapSymbol(market.collateral) : undefined
      return from && to ? t('margin.plan.step.preSwap', { from, to }) : t('common.swap')
    }
    case 'MARGIN_OPEN':
      return t('margin.plan.step.open')
    case 'MARGIN_CLOSE':
      return t('margin.plan.step.close')
    case 'MARGIN_ADJUST':
      return t('margin.plan.step.adjust')
    // Reachable on the wire even though no client surface builds a recover plan: the server sweeps
    // funds parked at the account back to the wallet.
    case 'MARGIN_RECOVER':
      return t('margin.plan.step.recover')
    case 'MARGIN_BRIDGE': {
      // findMarginTokenSymbol only resolves tokens the injected resolver knows about, so an
      // L2-USDC tokenIn may not resolve — default to USDC and name the chains off the step's chain fields.
      const symbol = findMarginTokenSymbol({ address: step.tokenIn, resolveSymbol }) ?? 'USDC'
      if (step.status === 'IN_PROGRESS') {
        return t('margin.plan.step.bridging', { symbol })
      }
      const from = marginChainName(step.tokenInChainId)
      const to = marginChainName(step.tokenOutChainId ?? MARGIN_CHAIN_ID)
      return t('margin.plan.step.bridge', { symbol, from, to })
    }
    // The raw wire enum, deliberately: a step type this client does not know cannot be named, and a
    // guess would be worse than the identifier. Every type in the union above HAS an arm, so this is
    // reachable only by wire drift.
    default:
      return step.stepType
  }
}

// The source-symbol resolver is a hook, so it can't live in the pure stepTitle. This per-step row
// owns the useCurrencyInfo lookup and threads the resolved symbol in. useCurrencyInfo(undefined)
// no-ops for steps without a resolvable tokenIn (permit / intent steps).
function MarginPlanStepRow({
  step,
  market,
  status,
  currentStepIndex,
  totalStepsCount,
  resolveSymbol,
}: {
  step: MarginPlanStep
  market?: MarginMarket
  status: StepStatus
  currentStepIndex: number
  totalStepsCount: number
  resolveSymbol: MarginSymbolResolver
}): JSX.Element {
  const { t } = useTranslation()
  const tokenInSymbol = useCurrencyInfo(marginStepTokenInCurrencyId(step))?.currency.symbol
  return (
    <StepRowSkeleton
      title={stepTitle({ step, market, t, tokenInSymbol, resolveSymbol })}
      status={status}
      icon={<Approve color="$neutral2" size="$icon.24" />}
      currentStepIndex={currentStepIndex}
      totalStepsCount={totalStepsCount}
    />
  )
}

export function MarginPlanReviewModal(): JSX.Element | null {
  const { t } = useTranslation()
  const plan = useMarginPlanExecution((s) => s.plan)
  const isModalOpen = useMarginPlanExecution((s) => s.isModalOpen)
  const isWalletPromptOpen = useMarginPlanExecution((s) => s.isWalletPromptOpen)
  const isExecuting = useMarginPlanExecution((s) => s.isExecuting)
  const stepError = useMarginPlanExecution((s) => s.stepError)
  const lastCreateRequest = useMarginPlanExecution((s) => s.lastCreateRequest)
  const lastManageAction = useMarginPlanExecution((s) => s.lastManageAction)
  const setModalOpen = useMarginPlanExecution((s) => s.actions.setModalOpen)
  const { executePlan, retryCurrentStep, restartPlan } = useExecuteMarginPlan()
  const { getMarketByTokens, markets } = useMarginMarkets()
  const account = useAccount()
  const queryClient = useQueryClient()
  const resolveSymbol = useEvent(
    (address: string): string | undefined => findMarginTokenInfoInMarkets({ markets, address })?.symbol,
  )

  // Dismissal is blocked only while a wallet prompt is actually open. Closing backgrounds the run:
  // the loop finishes watching in-flight work, then parks before its next wallet prompt (runLoop's
  // modal gate); the pending card / in-flight row takes over as the surface. The invalidation makes
  // a just-created plan's card appear promptly — within ~20s of create, no poll has cached it yet.
  const onClose = useEvent(() => {
    if (isWalletPromptOpen) {
      return
    }
    setModalOpen(false)
    if (plan) {
      void queryClient.invalidateQueries({ queryKey: MARGIN_POSITIONS_QUERY_KEY })
    }
  })
  const onRetry = useEvent(() => {
    void retryCurrentStep()
  })
  const onRestart = useEvent(() => {
    restartPlan()
  })
  // Backstop for the account-switch leak: resetForAccount clears a stale
  // lastCreateRequest on a confirmed switch, but this re-checks at click time too — a Retry must
  // never mint/execute a plan for the OLD swapper under the NEW connected wallet.
  const canRetryCreate =
    !!lastCreateRequest && isPlanForAccount({ planSwapper: lastCreateRequest.swapper, accountAddress: account.address })
  // Create-time failure (no plan minted yet) — re-run the exact same request.
  const onRetryCreate = useEvent(() => {
    if (lastCreateRequest && canRetryCreate) {
      // The action rides along: it is what the completion toast names ("Add margin" vs a bare adjust),
      // and executePlan overwrites it on every call — so omitting it here would blank the action a
      // create had before it failed.
      void executePlan({ request: lastCreateRequest, action: lastManageAction })
    }
  })

  if (!isModalOpen) {
    return null
  }
  if (!plan) {
    // executePlan opens the modal BEFORE the POST resolves — this branch is
    // the create round-trip spinner AND the create-failure surface (stepError
    // set with no plan). Never render an empty shell.
    return (
      <Modal name={ModalName.MarginPlanReview} isModalOpen={isModalOpen} maxWidth={420} padding={0} onClose={onClose}>
        <Flex p="$spacing16" gap="$spacing16" alignItems="center">
          {stepError ? (
            <Flex gap="$spacing8" width="100%">
              <Text variant="body3" color="$statusCritical">
                {stepError.message}
              </Text>
              <Flex row gap="$spacing8">
                <Button size="medium" emphasis="secondary" fill onPress={onClose}>
                  {t('common.button.close')}
                </Button>
                {canRetryCreate ? (
                  <Button size="medium" emphasis="primary" fill onPress={onRetryCreate}>
                    {t('margin.plan.error.retryCreate')}
                  </Button>
                ) : null}
              </Flex>
            </Flex>
          ) : (
            <SpinningLoader size={28} />
          )}
        </Flex>
      </Modal>
    )
  }
  const txCount = plan.steps.filter((s) => s.method === 'SEND_TX').length
  const sigCount = plan.steps.filter((s) => s.method === 'SIGN_MSG').length
  // Two count-pluralized fragments composed into the summary below: i18next takes one `count` per key
  // and that line carries two counts. Hard-pluralising instead read "up to 1 transactions and
  // 1 signature(s)" on the commonest plan there is — one permit and one open. Hoisted rather than
  // nested inside the summary's options object, which the string extractor does not walk into.
  const transactions = t('margin.plan.confirmTxCount', { count: txCount })
  const signatures = t('margin.plan.confirmSigCount', { count: sigCount })
  // Live-registry only: an unresolved key (registry down, or not yet loaded) drops the pair header
  // from the plan review rather than showing a wrong one.
  const market = getMarketByTokens({
    collateralToken: plan.collateralToken,
    debtToken: plan.debtToken,
    venue: plan.venue,
  })
  // Wallet rejection leaves the step AWAITING_ACTION with no error — without
  // an in-modal continue affordance the only recovery is re-clicking the form
  // CTA, which would CREATE A NEW PLAN (and strand this one's subId).
  // Terminal, not just COMPLETED: a FAILED or CANCELLED plan has nothing left to continue into —
  // runLoop's while-condition is already false, so the button would re-enter and return immediately.
  const showContinue = !isExecuting && !isWalletPromptOpen && !stepError && !isTerminalPlanStatus(plan.status)
  // Gated on the SAME predicate as the Restart branch. The note and the button are two halves of one
  // decision, and gating them differently is what let a code arrive with one and not the other. A code
  // outside the terminal set (wire drift) is refused here rather than falling through a `default`.
  const subject = resolveRestartSubject({ steps: plan.steps, stepError })
  const terminalNote =
    stepError && isTerminalStepError(stepError.code)
      ? restartNote({
          code: stepError.code,
          stepType: subject.stepType,
          moved: planMovedFunds({
            steps: plan.steps,
            failingStepIndex: subject.failingStepIndex,
            failingStepHasProof: resolveFailingStepProof({ plan, subject }),
          }),
          t,
        })
      : undefined

  return (
    <Modal name={ModalName.MarginPlanReview} isModalOpen={isModalOpen} maxWidth={420} padding={0} onClose={onClose}>
      <Flex p="$spacing16" gap="$spacing16">
        <Text variant="subheading1" color="$neutral1">
          {planTitle({
            intent: plan.intent,
            direction: planReviewDirection({ market, plan }),
            t,
          })}
        </Text>
        {market ? (
          <Text variant="body3" color="$neutral2">
            {marginPairLabel({ market })}
          </Text>
        ) : null}
        <Separator />
        <Flex>
          {plan.steps.map((step, i) => (
            <MarginPlanStepRow
              key={step.stepIndex}
              step={step}
              market={market}
              status={toStepStatus({ step, plan, failingStepIndex: subject.failingStepIndex, isWalletPromptOpen })}
              currentStepIndex={i}
              totalStepsCount={plan.steps.length}
              resolveSymbol={resolveSymbol}
            />
          ))}
        </Flex>
        <Text variant="body4" color="$neutral3">
          {sigCount > 0
            ? t('margin.plan.confirmSummary', { transactions, signatures })
            : t('margin.plan.confirmSummaryTxOnly', { transactions })}
        </Text>
        {stepError ? (
          <Flex gap="$spacing8">
            <Text variant="body3" color="$statusCritical">
              {stepError.message}
            </Text>
            {isTerminalStepError(stepError.code) ? (
              <>
                {terminalNote ? (
                  <Text variant="body4" color="$neutral2">
                    {terminalNote}
                  </Text>
                ) : null}
                <Flex row>
                  <Button size="medium" emphasis="secondary" fill onPress={onRestart}>
                    {t('margin.plan.error.restart')}
                  </Button>
                </Flex>
              </>
            ) : (
              <Flex row>
                <Button size="medium" emphasis="secondary" fill onPress={onRetry}>
                  {t('margin.plan.error.retry')}
                </Button>
              </Flex>
            )}
          </Flex>
        ) : null}
        {showContinue ? (
          <Flex row>
            <Button size="medium" emphasis="primary" fill onPress={onRetry}>
              {t('margin.plan.continueInWallet')}
            </Button>
          </Flex>
        ) : null}
      </Flex>
    </Modal>
  )
}
