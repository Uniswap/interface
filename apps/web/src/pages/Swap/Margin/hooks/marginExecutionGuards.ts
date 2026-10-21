import { FetchError } from '@universe/api'
import { areEvmAddressesEqual } from '@universe/chains'
import type {
  MarginEip712StepPayload,
  MarginPlanResponse,
  MarginPlanStatus,
  MarginPlanStep,
  MarginPlanStepStatus,
  MarginTxStepPayload,
} from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { MARGIN_NATIVE_TOKEN_ADDRESS } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { MARGIN_ROUTER_ADDRESS } from '~/constants/margin'
import type { StoredStepProof } from '~/pages/Swap/Margin/hooks/marginStepProofCache'

// PermitSingle { PermitDetails details; address spender; uint256 sigDeadline }. Every read below goes
// through asString, so a non-string (absent / reshaped) value becomes undefined and the caller's
// compare fails closed instead of matching on a coerced value.
function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function toBigIntOrUndefined(value?: string): bigint | undefined {
  if (value === undefined) {
    return undefined
  }
  try {
    return BigInt(value)
  } catch {
    return undefined
  }
}

/**
 * A wire amount only counts as a FIGURE when it is strictly positive — the single rule behind every
 * amount this file reads, because each source had got it wrong separately.
 *
 * `'0'` is what the backend sends where the client expects absence, `BigInt('')` is `0n` rather than a
 * throw, and a negative would parse cleanly. All three classify the pull as an exact amount no balance
 * can fall short of (`balance < 0n` is never true), which silently disarms the pre-broadcast check and
 * skips the empty-wallet floor that the 'unpriced' arm exists to apply.
 */
function positiveWireAmount(value?: string): bigint | undefined {
  const parsed = toBigIntOrUndefined(value)
  return parsed !== undefined && parsed > 0n ? parsed : undefined
}

// Permit2's AllowanceTransfer cap. A permit signed at this value is an open-ended allowance, so it
// carries no information about the size of any particular pull.
const MAX_UINT160 = (1n << 160n) - 1n

// The exact figure the router may pull, taken from the COLLATERAL PermitSingle this plan already
// asked the client to sign: Permit2 caps the pull at `details.amount` ON-CHAIN, so no calldata the
// server composes can exceed it. Matched by SPENDER (the MarginRouter arm) plus token — a payment
// permit names the Universal Router and must never size the open.
function permittedCollateralPull({ steps, token }: { steps: MarginPlanStep[]; token: string }): bigint | undefined {
  for (const step of steps) {
    if (step.stepType !== 'APPROVAL_PERMIT' || step.method !== 'SIGN_MSG') {
      continue
    }
    // Partial, not the wire type: a NOT_READY permit carries an EMPTY payload, so `values` is absent
    // at runtime however the type reads.
    const values = (step.payload as Partial<MarginEip712StepPayload>).values
    if (!values || !areEvmAddressesEqual(asString(values.spender), MARGIN_ROUTER_ADDRESS)) {
      continue
    }
    const details = values.details as { token?: unknown; amount?: unknown } | undefined
    if (!areEvmAddressesEqual(asString(details?.token), token)) {
      continue
    }
    // Both non-figures are refused HERE, so every caller gets a real amount or nothing: a max-shaped
    // permit is an allowance ceiling that says nothing about this pull, and everything else goes
    // through the shared positive rule. Refusing rather than returning lets a later permit still match.
    const parsed = positiveWireAmount(asString(details?.amount))
    if (parsed !== undefined && parsed < MAX_UINT160) {
      return parsed
    }
  }
  return undefined
}

// What a MARGIN_OPEN will take OUT OF THE WALLET, as far as the client can establish it without the
// server's word for the amount:
//  - 'native':   equity rides as msg.value (Case B). No ERC-20 pull exists to check, and an
//                underfunded value is refused by the wallet itself before anything broadcasts.
//  - 'amount':   an exact figure — the step's own tokenInAmount, else a signed collateral permit
//                whose amount is a real figure rather than the MaxUint160 allowance cap.
//  - 'unpriced': a wallet pull with no client-side figure — an EIP-7702 smart account permits via an
//                on-chain Permit2.approve of MaxUint160, and a pre-swap-funded open carries no
//                tokenInAmount (its size is the swap receipt, known only server-side).
export type MarginOpenWalletPull =
  | { kind: 'native' }
  | { kind: 'amount'; token: string; amount: bigint }
  | { kind: 'unpriced'; token: string }

export function resolveOpenWalletPull({
  plan,
  step,
}: {
  plan: Pick<MarginPlanResponse, 'steps'>
  step: MarginPlanStep
}): MarginOpenWalletPull {
  const token = step.tokenIn
  // ABSENT, not falsy. An omitted tokenIn genuinely means native; `''` means a reshaped wire field, and
  // reading it as native was the one place in this chain where a degenerate value failed OPEN — it
  // skipped the balance read entirely. Falling through instead lands on `getAddress('')`, which throws
  // into runLoop's retryable CLIENT_ERROR before anything broadcasts.
  if (token === undefined || areEvmAddressesEqual(token, MARGIN_NATIVE_TOKEN_ADDRESS)) {
    return { kind: 'native' }
  }
  // A wrapNative open funds via msg.value: the folded /plan reports `tokenIn` as the
  // wrapped collateral (WETH), not the native sentinel, so a non-zero payload value is
  // the ground-truth native signal — there is no ERC-20 pull to balance-check.
  const openPayload = step.payload as MarginTxStepPayload | undefined
  const nativeValue =
    openPayload && typeof openPayload === 'object' && 'value' in openPayload
      ? toBigIntOrUndefined(openPayload.value)
      : undefined
  if (nativeValue !== undefined && nativeValue > 0n) {
    return { kind: 'native' }
  }
  // The step's own figure first, the permit only as a fallback. The permit is an AllowanceTransfer
  // CAP, not the pull: the backend signs collateral permits for MaxUint160 so an equity resize stays
  // covered, and reading that cap as the pull would fail every open closed.
  //
  // Both sources go through the SAME positive-figure rule, so a `'0'`, a blank or a negative on either
  // one falls through rather than posing as an exact pull. Fall through to the permit, and to
  // 'unpriced' if there is none.
  const amount = positiveWireAmount(step.tokenInAmount) ?? permittedCollateralPull({ steps: plan.steps, token })
  return amount === undefined ? { kind: 'unpriced', token } : { kind: 'amount', token, amount }
}

// A MARGIN_OPEN whose collateral the wallet no longer holds reverts on-chain and, because its hash is
// persisted before the PATCH, replays that revert on every resume. The executor reads the wallet's
// balance before broadcasting and fails closed on this decision. Pure so the balance IO stays in the
// hook. The server runs the same check when it MATERIALIZES the step (BE-16, typed
// INSUFFICIENT_SOURCE_FUNDS); this closes the window between that materialization and the broadcast,
// and covers the direct-payment shapes the server does not pre-check at all.
export function isOpenCollateralBalanceInsufficient({
  balance,
  pull,
}: {
  balance: bigint
  pull: MarginOpenWalletPull
}): boolean {
  switch (pull.kind) {
    case 'native':
      return false
    case 'amount':
      return balance < pull.amount
    case 'unpriced':
      // No figure to compare, but an EMPTY wallet provably cannot fund ANY pull — hold that floor
      // rather than waving the step through. Never false-blocks: a legitimate open always pulls > 0.
      return balance === 0n
    default:
      return true
  }
}

// The step the executor will prompt for next. Lives here, beside the other step predicates, because
// TWO surfaces must agree on it: `runLoop` picks the step to drive, and the review modal marks exactly
// one row Active. Written separately they can drift — narrowing the executor's choice (skipping a step
// that already carries a proof, say) would leave the modal highlighting a row the loop is not on.
export function firstActionableStep(plan: MarginPlanResponse): MarginPlanStep | undefined {
  return plan.steps.find((step) => step.status === 'AWAITING_ACTION')
}

/**
 * The step a terminal plan actually failed on, or undefined when the plan carries no per-step failure
 * at all — a CANCELLED plan, or a FAILED one the server left unmarked.
 *
 * By STATUS first: a server reset can leave a stale errorCode on a step it has since re-materialized,
 * and picking that one masks the step that really failed — which for the proof gate means dropping a
 * live broadcast hash.
 *
 * Exported because its ABSENCE is a second fact, not just this function's null case: the executor
 * mints a `stepIndex: 0` PLAN_TERMINAL sentinel exactly when this returns undefined, and the review
 * sheet has to recognise that sentinel to know the index names no step. A second copy of the rule
 * there would let a real index-0 failure read as the sentinel and attribute another step's proof to it.
 *
 * Not for the mid-run scan, which deliberately reads STATUS ONLY: a stale errorCode left on a step the
 * server has since re-materialized must not abort a healthy loop. Narrower on purpose — do not unify.
 */
export function erroredStep(steps: readonly MarginPlanStep[]): MarginPlanStep | undefined {
  return steps.find((step) => step.status === 'STEP_ERROR') ?? steps.find((step) => step.errorCode !== undefined)
}

// The bridge poll keeps polling ONLY while the deposit is still filling (IN_PROGRESS). Every
// other status is terminal for the poll: COMPLETE / STEP_ERROR (done), or a server-side auto-reset
// back to AWAITING_ACTION / NOT_READY, which must exit so runLoop's firstActionableStep re-prompts
// immediately rather than blind-stalling up to the ~6h fillDeadline.
export function isBridgePollExitStatus(status: MarginPlanStepStatus): boolean {
  return status !== 'IN_PROGRESS'
}

// A 4xx PATCH (incl. 409 conflict) is terminal — the proof is invalid or the step already advanced;
// retrying can't help. Only transient 5xx / network failures are retried (the BE PATCH is idempotent
// on identical proofs).
export function isTerminalPatchError(error: unknown): boolean {
  return error instanceof FetchError && error.response.status >= 400 && error.response.status < 500
}

export type ProofReplayDecision = 'advance' | 'replay' | 'reprompt'

// Reconciliation decision for a persisted broadcast proof when the executor re-encounters its step,
// given the step's CURRENT server materialization:
//  - 'advance':  the step is no longer AWAITING_ACTION — the server already consumed the proof; re-sync.
//  - 'replay':   AWAITING_ACTION with the SAME calldata — the PATCH never landed; re-PATCH the hash.
//  - 'reprompt': AWAITING_ACTION but the calldata POSITIVELY changed — a server reset re-materialized
//                the step with fresh deposit params; the cached hash is dead, broadcast the new one.
// Fail-safe direction: anything short of a positive calldata change stays 'replay' (never re-broadcast
// on doubt — a false 'reprompt' would double the on-chain deposit).
export function decideProofReplay({
  stored,
  freshStep,
}: {
  stored: Pick<StoredStepProof, 'to' | 'data'>
  freshStep?: MarginPlanStep
}): ProofReplayDecision {
  if (!freshStep || freshStep.status !== 'AWAITING_ACTION') {
    return 'advance'
  }
  const payload = freshStep.payload as MarginTxStepPayload
  // Re-broadcast ONLY on a CONFIDENT, normalized calldata change. All four of current + stored to/data
  // must be present (a partial/unmaterialized payload stays 'replay'), and they must differ after
  // case-normalization — an address compare for the target, a lowercased compare for the calldata hex — so
  // a formatting-only BE difference on an UNCHANGED step can never false-'reprompt'. Fail-safe
  // direction: any doubt stays 'replay' (never re-broadcast on doubt — a false 'reprompt' doubles the
  // on-chain deposit); normalization only ever moves a borderline case toward 'replay'.
  if (!payload.to || !payload.data || !stored.to || !stored.data) {
    return 'replay'
  }
  const calldataChanged =
    !areEvmAddressesEqual(payload.to, stored.to) || payload.data.toLowerCase() !== stored.data.toLowerCase()
  return calldataChanged ? 'reprompt' : 'replay'
}

// A plan minted under one wallet must only be signed by that same wallet.
export function isPlanForAccount({
  planSwapper,
  accountAddress,
}: {
  planSwapper: string
  accountAddress?: string
}): boolean {
  return areEvmAddressesEqual(planSwapper, accountAddress)
}

// A loop's TERMINAL writes (finalize: clear persisted pointer + form + close modal) aren't
// epoch-guarded at the store, so the loop must skip them once it has been superseded — i.e. its
// captured epoch no longer matches the store's current one (a reset/account-switch/fresh acquire
// moved it on). A zombie bridge-tail reaching COMPLETED must NOT wipe the live run's state.
export function isRunSuperseded({ epoch, currentEpoch }: { epoch: number; currentEpoch: number }): boolean {
  return epoch !== currentEpoch
}

// The executor loop's own terminal set. COMPLETED/FAILED end the run normally; CANCELLED
// must ALSO stop it — a resumed cancelled plan can still carry a residual AWAITING_ACTION step,
// which would otherwise re-prompt the wallet or spin the stall cap to a generic "Plan stalled" error.
const TERMINAL_PLAN_STATUSES = new Set<MarginPlanStatus>(['COMPLETED', 'FAILED', 'CANCELLED'])

export function isTerminalPlanStatus(status: MarginPlanStatus): boolean {
  return TERMINAL_PLAN_STATUSES.has(status)
}

// Fund-safety: the executor loop's per-iteration abort check, composed from the two guards
// above — re-checked at the TOP of every iteration, not just loop entry, so a mid-flight account
// switch (which bumps the epoch) or a stale/mismatched swapper can never reach the wallet.
export function shouldAbortLoopIteration({
  epoch,
  currentEpoch,
  planSwapper,
  accountAddress,
}: {
  epoch: number
  currentEpoch: number
  planSwapper: string
  accountAddress?: string
}): boolean {
  return isRunSuperseded({ epoch, currentEpoch }) || !isPlanForAccount({ planSwapper, accountAddress })
}

export type ReplayStallAction = 'reset' | 'stall' | 'bail'

// Livelock guard for the dup-guard reconcile loop: a replay/reconcile that ADVANCED
// the plan resets the stall counter; one that did NOT advance increments it (the caller sleeps between
// iterations) and BAILS to CLIENT_ERROR once it exceeds the cap — so a non-advancing terminal PATCH or
// a still-AWAITING_ACTION replay can never hot-spin GET+PATCH.
export function decideReplayStall({
  advanced,
  stalledPolls,
  maxAttempts,
}: {
  advanced: boolean
  stalledPolls: number
  maxAttempts: number
}): { stalledPolls: number; action: ReplayStallAction } {
  if (advanced) {
    return { stalledPolls: 0, action: 'reset' }
  }
  const next = stalledPolls + 1
  return { stalledPolls: next, action: next > maxAttempts ? 'bail' : 'stall' }
}

// Codes whose step payload is either dead (no re-stampable calldata, SOURCE_STEP_UNRECOVERABLE)
// or deliberately RETAINED server-side despite being terminal — INSUFFICIENT_SOURCE_FUNDS (top-up-and-
// retry) and PROOF_UNRECOVERABLE (a mainnet broadcast tx that may have already succeeded on-chain
// despite failing deterministic re-verification). Treating any of these as a normal Retry would either
// no-op or re-submit the retained payload — for PROOF_UNRECOVERABLE, a second leveraged position.
// PROOF_REVERIFY_FAILED is deliberately excluded — retryable by design (bridge-only, reset-eligible via
// the depositId interlock).
// MAX_REMATERIALIZE_EXCEEDED is terminal for a different reason: the server exhausted its
// re-materialization budget and will not retry, so a client Retry can only re-loop on the same GET.
// No tx broadcast for the failing attempt, so its restart copy must NOT imply parked funds.
// PLAN_TERMINAL is client-minted, not a wire code: a plan can reach a terminal STATUS with no step
// carrying an errorCode at all (a CANCELLED plan carries none), and the modal keys Restart-vs-Retry off
// this set — without it such a plan renders a step list with no message and no CTA.
export const TERMINAL_STEP_ERROR_CODES = [
  'SOURCE_STEP_UNRECOVERABLE',
  'INSUFFICIENT_SOURCE_FUNDS',
  'PROOF_UNRECOVERABLE',
  'MAX_REMATERIALIZE_EXCEEDED',
  'PLAN_TERMINAL',
] as const

// The union behind the set, so the restart-note switch can be exhaustive over it. Two independent
// lists of the same five codes let a sixth arrive with a Restart button, no note, and no compile
// error — and made the deliberate `PLAN_TERMINAL → undefined` case indistinguishable from an oversight.
export type MarginTerminalStepErrorCode = (typeof TERMINAL_STEP_ERROR_CODES)[number]

const TERMINAL_STEP_ERROR_CODE_SET: ReadonlySet<string> = new Set(TERMINAL_STEP_ERROR_CODES)

export function isTerminalStepError(code: string): code is MarginTerminalStepErrorCode {
  return TERMINAL_STEP_ERROR_CODE_SET.has(code)
}

// Terminal codes whose failing step broadcast NOTHING, so abandoning the plan may also drop its cached
// proofs. INSUFFICIENT_SOURCE_FUNDS fails the pre-broadcast balance check; MAX_REMATERIALIZE_EXCEEDED
// exhausts the server's budget before a send (see the note above).
//
// The other two are deliberately absent. PROOF_UNRECOVERABLE and SOURCE_STEP_UNRECOVERABLE both
// describe a tx that WAS broadcast and may still land, and the cached proof is doing two jobs for
// them: it withholds the pending card's Cancel (`shouldOfferPendingCancel`) so a plan with a possibly
// live deposit cannot be cancelled out from under it, and it is the only local record that a resume
// must replay rather than re-broadcast — dropping it risks a second leveraged position.
const PROOF_CLEARABLE_STEP_ERROR_CODES = new Set(['INSUFFICIENT_SOURCE_FUNDS', 'MAX_REMATERIALIZE_EXCEEDED'])

export function mayClearProofsOnAbandon({
  code,
  failingStepHasProof,
}: {
  code: string | undefined
  // Whether the FAILING step still holds a cached proof. Direct evidence beats the code's promise:
  // MAX_REMATERIALIZE_EXCEEDED says nothing was broadcast for the failing ATTEMPT, but a step that
  // broadcast, took PROOF_REVERIFY_FAILED, was reset and re-materialized until the budget ran out
  // arrives here holding one — a live deposit whose only local record this would delete, and whose
  // Cancel-suppression (`shouldOfferPendingCancel`) would be lifted with it.
  failingStepHasProof: boolean
}): boolean {
  // No code at all is not evidence that nothing was sent — fail closed and keep the proofs.
  return code !== undefined && PROOF_CLEARABLE_STEP_ERROR_CODES.has(code) && !failingStepHasProof
}

export type OpenCtaAction = { kind: 'resume'; planId: string } | { kind: 'block' } | { kind: 'create' }

// Open CTA decision — "form is truth": the CTA always opens what the form shows. Re-focus an OPEN
// that the in-memory executor still holds (resume its live run). Block a fresh OPEN while ANY other
// in-memory plan (any intent) is still in flight — it reserves a subId and the Open CTA can't resume
// it under a foreign intent; the positions-table banner owns that path. Otherwise create. A stranded
// plan from a prior session surfaces as a pending-plan card, not auto-resumed here.
export function decideOpenAction({
  existing,
}: {
  existing?: Pick<MarginPlanResponse, 'planId' | 'intent' | 'status'>
}): OpenCtaAction {
  // Terminal covers FAILED and CANCELLED as well as COMPLETED: a plan that ended is not in flight, and
  // testing COMPLETED alone would leave the Open CTA resuming a dead run or blocked behind one.
  if (existing && existing.intent === 'OPEN' && !isTerminalPlanStatus(existing.status)) {
    return { kind: 'resume', planId: existing.planId }
  }
  const heldByStore = !!existing && !isTerminalPlanStatus(existing.status)
  if (heldByStore) {
    return { kind: 'block' }
  }
  return { kind: 'create' }
}
