import { useQueryClient } from '@tanstack/react-query'
import { TradeType } from '@uniswap/sdk-core'
import { FetchError, TradingApi, is404Error } from '@universe/api'
import { UniverseChainId } from '@universe/chains'
import type { TFunction } from 'i18next'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type {
  MarginActionKey,
  MarginCreatePlanRequest,
  MarginEip712StepPayload,
  MarginPlanResponse,
  MarginPlanStatus,
  MarginPlanStep,
  MarginPlanStepProof,
  MarginTxStepPayload,
} from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { MARGIN_ADD_EQUITY_ACTION_KEYS, MarginApiClient } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { MARGIN_MARKETS_QUERY_KEY } from 'uniswap/src/data/apiClients/tradingApi/useMarginMarketsQuery'
import { MARGIN_POSITIONS_QUERY_KEY } from 'uniswap/src/data/apiClients/tradingApi/useMarginPositionsQuery'
import { mapTAPIPlanStatusToTXStatus } from 'uniswap/src/features/activity/extract/statusMappers'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useMarginFormStoreActions } from 'uniswap/src/features/transactions/margin/stores/marginFormStore/useMarginFormStore'
import type { MarginManageAction, MarginVenue } from 'uniswap/src/features/transactions/margin/types'
/* oxlint-disable max-lines */
import {
  addTransaction as addTransactionAction,
  updateTransaction as updateTransactionAction,
} from 'uniswap/src/features/transactions/slice'
import {
  TransactionOriginType,
  TransactionType,
  type PlanTransactionInfo,
  type TransactionDetails,
  type TransactionTypeInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { BackoffStrategy, retryWithBackoff } from 'utilities/src/async/retryWithBackoff'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { getAccount, getClient, getConnectorClient } from 'wagmi/actions'
import { createContract, erc20Abi, getAddress, parseUnits } from '~/chains'
import { wagmiConfig } from '~/connection/wagmiConfig'
import { MARGIN_CHAIN_ID } from '~/constants/margin'
import { useAccount } from '~/hooks/useAccount'
import { clientToProvider, useEthersProvider, useEthersWeb3Provider } from '~/hooks/useEthersProvider'
import { useSelectChain } from '~/hooks/useSelectChain'
import {
  decideProofReplay,
  decideReplayStall,
  erroredStep,
  firstActionableStep,
  isBridgePollExitStatus,
  isOpenCollateralBalanceInsufficient,
  isPlanForAccount,
  isRunSuperseded,
  isTerminalPatchError,
  isTerminalPlanStatus,
  isTerminalStepError,
  mayClearProofsOnAbandon,
  resolveOpenWalletPull,
  shouldAbortLoopIteration,
} from '~/pages/Swap/Margin/hooks/marginExecutionGuards'
import { type MarginAcquiredEpoch, marginPlanExecutionStore } from '~/pages/Swap/Margin/hooks/marginPlanExecutionStore'
import {
  clearPersistedPlanId,
  getPersistedMarginPlanId,
  persistPlanId,
} from '~/pages/Swap/Margin/hooks/marginPlanPointer'
import {
  clearPlanProofs,
  clearStepProof,
  readStepProof,
  writeStepProof,
} from '~/pages/Swap/Margin/hooks/marginStepProofCache'
import { getMappedMarginErrorMessage } from '~/pages/Swap/Margin/marginQuoteError'
import { useAppDispatch } from '~/state/hooks'
import reduxStore from '~/state/index'
import { popupRegistry } from '~/state/popups/registry'
import { PopupType } from '~/state/popups/types'
import { useTransactionAdderFromHash } from '~/state/transactions/adder'
import { signTypedData } from '~/utils/signing'
import { didUserReject } from '~/utils/swapErrorToUserReadableMessage'

// Verification budget: a non-bridge step must confirm within POLL_INTERVAL_MS × MAX_POLL_ATTEMPTS
// (≥60s). If the interval shrinks, raise MAX_POLL_ATTEMPTS so their product stays ≥60s.
const POLL_INTERVAL_MS = 1000
const MAX_POLL_ATTEMPTS = 60
// Relaxed cadence for a multi-minute Across fill — never uses the 60×1s step caps.
const BRIDGE_POLL_INTERVAL_MS = 5000

// PATCH retry policy: the BE PATCH is idempotent on identical proofs, so a transient 5xx / network
// failure is safe to replay. A 4xx (incl. 409 conflict) is terminal (isTerminalPatchError).
const PATCH_MAX_ATTEMPTS = 3
const PATCH_BASE_DELAY_MS = 500

// retryWithBackoff wraps a bailed/exhausted error as `new Error(msg, { cause })`; unwrap one level to
// inspect the underlying FetchError.
function unwrapCause(error: unknown): unknown {
  return error instanceof Error && error.cause !== undefined ? error.cause : error
}

// didUserReject (shared prod util) walks cause/originalError/error/data.originalError but not the
// ethers-v5 `.info.error.code` chain, so supplement it here: a 4001 nested under `info.error` is a
// silent rejection, not a spurious CLIENT_ERROR popup.
function isMarginUserRejection(error: unknown): boolean {
  if (didUserReject(error)) {
    return true
  }
  const code = (error as { info?: { error?: { code?: unknown } } } | null)?.info?.error?.code
  return code === 4001
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// The `open` allowlist behind a create, for analytics. Only the open form has one — a manage request
// never names a venue, the position's is already pinned.
export interface MarginVenuePreference {
  allowlistSent: MarginVenue[]
  excludedCount: number
}

// The ten-key the running plan was quoted under. The plan envelope carries only the coarse `intent`,
// so the key is stamped when the create request is stashed and then kept on its own field — the
// stash itself is dropped the moment a retry takes over the surface, mid-run. Absent for a plan
// resumed in a later session, where nothing local ever saw its quote.
function lastQuotedActionKey(): MarginActionKey | undefined {
  return marginPlanExecutionStore.getState().lastQuotedAction
}

// One pointer slot exists per swapper, so a clear is only safe while the slot still names THIS plan.
// A completion in another tab — or a parked bridge tail reaching FAILED hours later, which needs no
// epoch move at all — would otherwise delete the resume pointer of whatever plan is live for that
// wallet now.
function clearPointerIfOwned({ swapper, planId }: { swapper: string; planId: string }): void {
  if (getPersistedMarginPlanId(swapper)?.planId === planId) {
    clearPersistedPlanId(swapper)
  }
}

// The wrong-account surface, built once: three guard exits raise it (runLoop's swapper check, the
// create path's supersession exit, resumePlan's), and those are exactly the exits whose cleanup
// contracts have drifted apart a piece at a time.
function wrongAccountStepError(t: TFunction): {
  stepIndex: number
  code: string
  message: string
  namesStep: false
} {
  // The wallet is wrong for the whole plan; no step failed. The 0 is a placeholder.
  return { stepIndex: 0, code: 'WRONG_ACCOUNT', message: t('margin.plan.wrongAccount'), namesStep: false }
}

function erroredStepError(step: MarginPlanStep): { stepIndex: number; code: string; message: string } {
  return {
    stepIndex: step.stepIndex,
    code: step.errorCode ?? 'STEP_ERROR',
    message: step.errorDetail ?? 'Step failed',
  }
}

// A MARGIN_BRIDGE step sits IN_PROGRESS for the whole Across fill.
function findBridgingStep(plan: MarginPlanResponse): MarginPlanStep | undefined {
  return plan.steps.find((s) => s.stepType === 'MARGIN_BRIDGE' && s.status === 'IN_PROGRESS')
}

// The chain a SIGN_MSG permit is validated + signed against: the step's own
// tokenInChainId, else the permit's domain chain, else the margin chain. Invariant: the BE composes
// each typed-data permit for a single chain and only cross-chain payment permits are transformed to
// an on-chain Permit2.approve SEND_TX (validated as APPROVAL_PERMIT), so a SIGN_MSG permit resolves
// to the margin chain. Number.isInteger guards Number(undefined)=NaN (?? would not catch NaN).
function signMsgChainId(step: MarginPlanStep): number {
  const domainChain = Number((step.payload as MarginEip712StepPayload).domain.chainId)
  return step.tokenInChainId ?? (Number.isInteger(domainChain) ? domainChain : MARGIN_CHAIN_ID)
}

function toPlanErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return 'Plan failed'
}

// Activity surface: only the four position actions register pending txs — approvals and the
// pre-swap do not. Sizing fields come from the create request when available (fresh plans);
// resumed plans fall back to the step wire fields where one exists — `marginAmount` and
// `collateralToBuy` have one, `leverageX18` and `maxDebtIn` do not, so a resumed plan files '0' for
// those two. The activity row reads them for detail, not for correctness.
export function buildStepActivityInfo({
  plan,
  step,
  createRequest,
}: {
  plan: MarginPlanResponse
  step: MarginPlanStep
  createRequest?: MarginCreatePlanRequest
}): TransactionTypeInfo | undefined {
  const base = { marketKey: plan.marketKey, collateralToken: plan.collateralToken, debtToken: plan.debtToken }
  // Create is quote-only now — every OPEN/ADJUST sizing field the activity feed wants comes off the
  // posted quote (marginQuote) instead of the retired flat create-request fields.
  const quote = createRequest?.marginQuote
  switch (step.stepType) {
    case 'MARGIN_OPEN': {
      const increase = quote?.legs[0]?.bounds.increase
      // `'0'` is absence, not a figure — the same wire shape the ADJUST branch below guards. A
      // pre-swap-funded open carries no wallet pull, so the backend sends '0' and the real margin sits
      // on the quote; `??` alone would file the row as a zero-margin open.
      const openPull = step.tokenInAmount === '0' ? undefined : step.tokenInAmount
      return {
        type: TransactionType.MarginOpenPosition,
        ...base,
        marginAmount: openPull ?? quote?.swapConfig?.amount ?? '0',
        // The activity feed's own type is unrelated to the margin wire and still expects WAD.
        leverageX18: quote?.leverageTarget ? parseUnits(quote.leverageTarget, 18).toString() : '0',
        collateralToBuy: increase?.collateralToBuy ?? step.tokenOutAmount ?? '0',
        maxDebtIn: increase?.maxDebtIn ?? '0',
      }
    }
    case 'MARGIN_CLOSE':
      return { type: TransactionType.MarginClosePosition, ...base }
    case 'MARGIN_ADJUST': {
      // ADJUST unifies add/withdraw/leverage. Only the add (deposit) case maps to an existing activity
      // type (MarginAddCollateral); a withdraw or a leverage-only adjust has no payment and emits no row.
      // The ACTION KEY is the discriminator: swapConfig names a token in both directions (on a
      // withdrawal it is what the user gets back), so its presence says nothing about the direction.
      const isDeposit = quote !== undefined && MARGIN_ADD_EQUITY_ACTION_KEYS.some((key) => key === quote.action)
      // The key gates the wire amount, not the reverse: a non-deposit adjust still carries a
      // tokenInAmount (the backend sends '0', which is both non-nullish and truthy), so reading it
      // first would file a deposit row for a withdrawal.
      // Same `'0'`-is-absence normalization as the OPEN branch above: a pre-swap-funded deposit has no
      // wallet pull, and taking the sentinel literally files the row with amount 0.
      const adjustPull = step.tokenInAmount === '0' ? undefined : step.tokenInAmount
      const amount = isDeposit ? (adjustPull ?? quote.swapConfig?.amount) : undefined
      return amount ? { type: TransactionType.MarginAddCollateral, ...base, amount } : undefined
    }
    default:
      return undefined
  }
}

function marginPlanStatusToTAPIPlanStatus(status: MarginPlanStatus): TradingApi.PlanStatus | undefined {
  switch (status) {
    case 'ACTIVE':
      return TradingApi.PlanStatus.ACTIVE
    case 'AWAITING_ACTION':
      return TradingApi.PlanStatus.AWAITING_ACTION
    case 'IN_PROGRESS':
      return TradingApi.PlanStatus.IN_PROGRESS
    case 'COMPLETED':
      return TradingApi.PlanStatus.COMPLETED
    case 'FAILED':
    case 'CANCELLED':
      return TradingApi.PlanStatus.FAILED
    default:
      return undefined
  }
}

// The plan-level activity row: one TransactionType.Plan row per margin plan, alongside the four
// per-step TransactionType.Margin* rows from buildStepActivityInfo above. Modeled on the real
// chained-plan row (extractPlanResponseDetails.ts) — same shape, but keyed by planId with no hash
// (margin never enters prod planSaga, so there's no watchPlanStep polling loop to keep it fresh;
// it's only written on plan start + finalize).
function buildMarginPlanTransactionDetails({
  plan,
  from,
}: {
  plan: MarginPlanResponse
  from: Address
}): TransactionDetails {
  const typeInfo: PlanTransactionInfo = {
    type: TransactionType.Plan,
    planId: plan.planId,
    planStatus: marginPlanStatusToTAPIPlanStatus(plan.status),
    stepDetails: [],
    tokenOutChainId: MARGIN_CHAIN_ID,
    inputCurrencyId: buildCurrencyId(MARGIN_CHAIN_ID, plan.debtToken),
    outputCurrencyId: buildCurrencyId(MARGIN_CHAIN_ID, plan.collateralToken),
    inputCurrencyAmountRaw: '0',
    outputCurrencyAmountRaw: '0',
    tradeType: TradeType.EXACT_INPUT,
    isMarginPlan: true,
  }
  return {
    routing: TradingApi.Routing.CHAINED,
    id: plan.planId,
    chainId: MARGIN_CHAIN_ID,
    status: mapTAPIPlanStatusToTXStatus(typeInfo.planStatus),
    addedTime: Date.now(),
    updatedTime: Date.now(),
    from,
    typeInfo,
    transactionOriginType: TransactionOriginType.Internal,
    options: { request: {} },
  }
}

// Add on first write (plan start), full-replace update thereafter (plan finalize) — mirrors
// addOrUpdatePlanTransaction's add-vs-update branch (planPollingUtils.ts) since Redux's
// addTransaction asserts the id doesn't already exist. The existing-row check reads the store
// at DISPATCH time: a single-step plan can start and finalize within one render window, and a
// render-captured selector would still see no row on the second call and re-add (which throws).
function useUpsertMarginPlanTransaction(): (params: { plan: MarginPlanResponse }) => void {
  const account = useAccount()
  const dispatch = useAppDispatch()

  return useEvent(({ plan }: { plan: MarginPlanResponse }) => {
    if (!account.address) {
      return
    }
    const existingRowsForChain = reduxStore.getState().transactions[account.address]?.[MARGIN_CHAIN_ID]
    const details = buildMarginPlanTransactionDetails({ plan, from: account.address })
    dispatch(existingRowsForChain?.[plan.planId] ? updateTransactionAction(details) : addTransactionAction(details))
  })
}

export function useExecuteMarginPlan(): {
  executePlan: (params: {
    request: MarginCreatePlanRequest
    action?: MarginManageAction
    venuePreference?: MarginVenuePreference
  }) => Promise<void>
  resumePlan: (params: { planId: string }) => Promise<void>
  retryCurrentStep: () => Promise<void>
  restartPlan: () => void
} {
  const { t } = useTranslation()
  const account = useAccount()
  const selectChain = useSelectChain()
  const readProvider = useEthersProvider({ chainId: MARGIN_CHAIN_ID })
  const walletProvider = useEthersWeb3Provider({ chainId: MARGIN_CHAIN_ID })
  const queryClient = useQueryClient()
  const addTransaction = useTransactionAdderFromHash()
  const upsertMarginPlanTransaction = useUpsertMarginPlanTransaction()
  const { setMarginFormState } = useMarginFormStoreActions()
  const store = marginPlanExecutionStore

  // Confirmed account switch: drop a plan minted under the previous wallet (and abort its loop via
  // the epoch bump). Clears the stale in-flight row and un-suppresses the persisted resume banner
  // (gated on `!plan` in MarginPositionsTable). resetForAccount ignores a transient undefined blip,
  // so a wallet-lock / provider-reconnect doesn't abort an in-flight plan.
  useEffect(() => {
    store.getState().actions.resetForAccount({ address: account.address })
  }, [account.address, store])

  // Per-chain signer seam: the margin-chain walletProvider hook can't be re-invoked mid-loop, so a
  // non-mainnet SEND_TX derives its signer via wagmi's connector client. There is no execution gate
  // — the loop attempts every step; an L2 send simply fails at the wallet/RPC boundary, surfacing as
  // an ordinary STEP_ERROR. Signer type derived from the provider to avoid a direct ethers import
  // (lint-blocked in apps/web/src outside the allowlist).
  //
  // Derived fresh per call, never cached: a signer is bound to the address it was made for, and this
  // loop outlives account switches by design — a cached one is exactly the captured wallet state every
  // other read on the signing path deliberately avoids. The cost is one connector round-trip per
  // off-margin-chain step, which only bridge plans pay.
  type ChainSigner = ReturnType<NonNullable<typeof walletProvider>['getSigner']>
  const getSignerForChain = useEvent(async (chainId: number): Promise<ChainSigner> => {
    if (chainId === MARGIN_CHAIN_ID && walletProvider) {
      return walletProvider.getSigner(account.address)
    }
    const client = await getConnectorClient(wagmiConfig, { chainId })
    const provider = clientToProvider(client, chainId)
    if (!provider) {
      throw new Error('No wallet provider for chain')
    }
    return provider.getSigner(account.address)
  })

  const finalize = useEvent(async ({ plan, epoch }: { plan: MarginPlanResponse; epoch: number }): Promise<void> => {
    // A superseded/zombie loop (e.g. a post-account-switch bridge tail) can still reach COMPLETED
    // on its LOCAL plan and would otherwise wipe the LIVE loop's persisted pointer + form + modal.
    // These writes aren't epoch-guarded at the store, so gate finalize itself.
    if (isRunSuperseded({ epoch, currentEpoch: store.getState().actions.currentEpoch() })) {
      return
    }
    clearPointerIfOwned({ swapper: plan.swapper, planId: plan.planId })
    // Terminal: drop this plan's persisted broadcast proofs so a later run never replays a stale hash.
    clearPlanProofs({ swapper: plan.swapper, planId: plan.planId })
    upsertMarginPlanTransaction({ plan })
    setMarginFormState({ activePlanId: undefined, marginAmount: '' })
    await queryClient.invalidateQueries({ queryKey: MARGIN_POSITIONS_QUERY_KEY })
    await queryClient.invalidateQueries({ queryKey: MARGIN_MARKETS_QUERY_KEY })
    store.getState().actions.setModalOpen(false)
    // Success toast is rendered by the review modal / table layer off plan.status —
    // popupRegistry.addPopup with a translated per-intent message.
  })

  const pollStep = useEvent(
    async ({
      planId,
      stepIndex,
      epoch,
    }: {
      planId: string
      stepIndex: number
      epoch: number
    }): Promise<MarginPlanResponse> => {
      for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
        const plan = await MarginApiClient.getMarginPlan({ planId })
        store.getState().actions.setPlan({ plan, epoch })
        const step = plan.steps.find((s) => s.stepIndex === stepIndex)
        if (step && (step.status === 'COMPLETE' || step.status === 'STEP_ERROR')) {
          if (step.status === 'COMPLETE') {
            sendAnalyticsEvent(InterfaceEventName.MarginPlanStepCompleted, {
              intent: plan.intent,
              action: lastQuotedActionKey(),
              stepType: step.stepType,
              stepIndex: step.stepIndex,
            })
          }
          return plan
        }
        await sleep(POLL_INTERVAL_MS)
      }
      throw new Error('Timed out waiting for step verification')
    },
  )

  // Bridge poll: relaxed interval, budgeted against fillDeadline (or a 10-min fallback),
  // never a client false-fail. The GET drives the server-side fill watcher; the deadline just
  // stops the loop so the next GET surfaces the server's EXPIRED.
  const pollBridgeStep = useEvent(
    async ({
      planId,
      step,
      epoch,
    }: {
      planId: string
      step: MarginPlanStep
      epoch: number
    }): Promise<MarginPlanResponse> => {
      const deadlineMs = step.fillDeadline ? Number(step.fillDeadline) * 1000 : Date.now() + 10 * 60_000
      for (;;) {
        const plan = await MarginApiClient.getMarginPlan({ planId })
        store.getState().actions.setPlan({ plan, epoch })
        const s = plan.steps.find((x) => x.stepIndex === step.stepIndex)
        // Exit on any non-IN_PROGRESS status — a server-side auto-reset back to
        // AWAITING_ACTION / NOT_READY must break the poll so runLoop's firstActionableStep re-prompts
        // immediately, instead of blind-stalling on the reset step up to the ~6h fillDeadline.
        if (s && isBridgePollExitStatus(s.status)) {
          return plan
        }
        await sleep(BRIDGE_POLL_INTERVAL_MS)
        // Past the deadline the caller re-enters immediately (bridging is exempt from the stall cap),
        // so the sleep has to happen before this returns or the two spin at network speed.
        if (Date.now() > deadlineMs) {
          return plan
        }
      }
    },
  )

  // A bridge deposit takes minutes to fill — poll it on the relaxed budget; every other step
  // verifies within the 60×1s caps.
  const pollForStep = useEvent(
    async ({
      plan,
      step,
      epoch,
    }: {
      plan: MarginPlanResponse
      step: MarginPlanStep
      epoch: number
    }): Promise<MarginPlanResponse> => {
      return step.stepType === 'MARGIN_BRIDGE'
        ? await pollBridgeStep({ planId: plan.planId, step, epoch })
        : await pollStep({ planId: plan.planId, stepIndex: step.stepIndex, epoch })
    },
  )

  // PATCH a step proof, retrying transient (5xx / network) failures — safe because the BE PATCH is
  // idempotent on identical proofs. A terminal 4xx (incl. 409) is NOT retried; the underlying
  // FetchError is re-thrown (unwrapped from retryWithBackoff's Error wrapper) so the caller decides:
  // the main broadcast path lets it surface as CLIENT_ERROR (a genuinely bad proof), while the replay
  // path reconciles a 409 (server already holds the proof) via a fresh GET.
  const submitStepProof = useEvent(
    async ({
      planId,
      stepIndex,
      proof,
    }: {
      planId: string
      stepIndex: number
      proof: MarginPlanStepProof
    }): Promise<MarginPlanResponse> => {
      try {
        return await retryWithBackoff({
          fn: () => MarginApiClient.updateMarginPlan({ planId, steps: [{ stepIndex, proof }] }),
          config: {
            maxAttempts: PATCH_MAX_ATTEMPTS,
            baseDelayMs: PATCH_BASE_DELAY_MS,
            backoffStrategy: BackoffStrategy.Exponential,
            shouldRetry: (error) => !isTerminalPatchError(error),
          },
        })
      } catch (error) {
        throw unwrapCause(error)
      }
    },
  )

  // Pre-broadcast dup guard (the primary fund-safety check). Only SEND_TX broadcasts
  // are guarded — a re-signed SIGN_MSG has no on-chain effect. When THIS step already broadcast a tx
  // (its hash was persisted the instant sendTransaction resolved, BEFORE the PATCH), reconciles that
  // proof instead of re-prompting a second on-chain tx (the double depositV3 bug). Returns:
  //   'proceed'                          — no prior broadcast; caller signs the current step.
  //   { plan, advanced: true }           — progress made (server consumed it, replay succeeded, or a
  //                                        reset re-materialized fresh calldata); re-loop, reset stall.
  //   { plan, advanced: false }          — reconciled a terminal PATCH but the step didn't move;
  //                                        re-loop and count toward the stall cap (livelock guard).
  const replayPersistedProof = useEvent(
    async ({
      plan,
      step,
      epoch,
    }: {
      plan: MarginPlanResponse
      step: MarginPlanStep
      epoch: number
    }): Promise<'proceed' | { plan: MarginPlanResponse; advanced: boolean }> => {
      const stored =
        step.method === 'SEND_TX'
          ? readStepProof({ swapper: plan.swapper, planId: plan.planId, stepIndex: step.stepIndex })
          : undefined
      if (!stored?.txHash) {
        return 'proceed'
      }
      const fresh = await MarginApiClient.getMarginPlan({ planId: plan.planId })
      const freshStep = fresh.steps.find((s) => s.stepIndex === step.stepIndex)
      const decision = decideProofReplay({ stored, freshStep })
      if (decision === 'reprompt') {
        // Server RESET & re-materialized with fresh calldata: the cached hash is dead. Drop it
        // and re-loop on the fresh plan — next iteration finds the proof cleared and signs the new tx.
        clearStepProof({ swapper: plan.swapper, planId: plan.planId, stepIndex: step.stepIndex })
        store.getState().actions.setPlan({ plan: fresh, epoch })
        return { plan: fresh, advanced: true }
      }
      if (decision === 'advance') {
        store.getState().actions.setPlan({ plan: fresh, epoch })
        return { plan: fresh, advanced: true }
      }
      // 'replay': AWAITING_ACTION with the SAME calldata — the PATCH never landed. Re-PATCH the stored
      // hash idempotently, never re-prompting the wallet. `advanced` is recomputed from the polled step
      // status (symmetric with the 409-reconcile path below) — NOT assumed true: if the step is still
      // AWAITING_ACTION after the poll (e.g. a bridge auto-reset back to AWAITING, or a BE that didn't
      // transition to IN_PROGRESS), the loop counts it toward the stall cap instead of hot-spinning.
      try {
        const patched = await submitStepProof({
          planId: plan.planId,
          stepIndex: step.stepIndex,
          proof: { txHash: stored.txHash },
        })
        store.getState().actions.setPlan({ plan: patched, epoch })
        const polled = await pollForStep({ plan: patched, step, epoch })
        const polledStep = polled.steps.find((s) => s.stepIndex === step.stepIndex)
        return { plan: polled, advanced: !polledStep || polledStep.status !== 'AWAITING_ACTION' }
      } catch (error) {
        if (!isTerminalPatchError(error)) {
          throw error
        }
        // 409 / 4xx: the server already holds this proof (or rejected it). Re-GET and let the loop
        // re-evaluate; only count as progress if the step actually moved (else the stall cap fires).
        const reconciled = await MarginApiClient.getMarginPlan({ planId: plan.planId })
        const reconciledStep = reconciled.steps.find((s) => s.stepIndex === step.stepIndex)
        store.getState().actions.setPlan({ plan: reconciled, epoch })
        return { plan: reconciled, advanced: !reconciledStep || reconciledStep.status !== 'AWAITING_ACTION' }
      }
    },
  )

  // Prompt the wallet for the actionable step: sign a SIGN_MSG permit, or broadcast a SEND_TX and
  // persist its proof (+ calldata identity) BEFORE the PATCH (dup guard). Returns 'rejected' on a user
  // rejection (nothing submitted — the step stays AWAITING_ACTION); any other error propagates to the
  // loop's catch.
  const signOrBroadcastStep = useEvent(
    async ({
      step,
      signer,
      plan,
      epoch,
    }: {
      plan: MarginPlanResponse
      step: MarginPlanStep
      signer: ChainSigner
      epoch: number
    }): Promise<{ proof: MarginPlanStepProof } | 'rejected'> => {
      store.getState().actions.setWalletPromptOpen({ open: true, epoch })
      try {
        if (step.method === 'SIGN_MSG') {
          const payload = step.payload as MarginEip712StepPayload
          const signature = await signTypedData({
            signer,
            domain: payload.domain,
            types: payload.types,
            value: payload.values,
          })
          return { proof: { signature } }
        }
        const payload = step.payload as MarginTxStepPayload
        const tx = await signer.sendTransaction({
          to: payload.to,
          data: payload.data,
          value: payload.value ? BigInt(payload.value) : undefined,
          // '0' is absence on this wire, not a limit — the same sentinel permittedCollateralPull
          // documents for tokenInAmount. Passed through it becomes `0n`, which the node rejects for
          // intrinsic gas instead of estimating, and the venue step's buffered limit is load-bearing.
          gasLimit: payload.gasLimit && payload.gasLimit !== '0' ? BigInt(payload.gasLimit) : undefined,
          chainId: payload.chainId,
        })
        // The tx is now on the network — persist the proof BEFORE the PATCH so a crash/reload replays
        // this hash (dup guard) instead of re-broadcasting. Store the calldata identity too, so a later
        // server reset (fresh depositV3 params) re-prompts rather than replaying the dead hash.
        writeStepProof({
          swapper: plan.swapper,
          planId: plan.planId,
          stepIndex: step.stepIndex,
          txHash: tx.hash,
          to: payload.to,
          data: payload.data,
        })
        return { proof: { txHash: tx.hash } }
      } catch (error) {
        if (isMarginUserRejection(error)) {
          // Silent: nothing submitted, server never sees it, step stays AWAITING_ACTION.
          return 'rejected'
        }
        throw error
      } finally {
        store.getState().actions.setWalletPromptOpen({ open: false, epoch })
      }
    },
  )

  // Resolve the epoch this run executes under. executePlan already holds the lock (acquired before
  // the create POST) and hands its epoch down. resume/retry acquire here — their pre-work GET is
  // side-effect-free, so there's nothing to strand if the acquire fails. undefined ⇒ another loop
  // owns the lock ⇒ the caller must no-op.
  const acquireRunEpoch = useEvent(
    ({
      providedEpoch,
      planId,
    }: {
      providedEpoch?: MarginAcquiredEpoch
      planId: string
    }): MarginAcquiredEpoch | undefined => {
      if (providedEpoch !== undefined) {
        return providedEpoch
      }
      const { acquired, epoch } = store.getState().actions.tryAcquireExecution({ planId })
      return acquired ? epoch : undefined
    },
  )

  // Before broadcasting the OPEN, read the wallet's balance of the token the open will PULL and fail
  // closed if it can't cover. BE-16 lands the swapped collateral in the EOA and the open spends it
  // from there, so the user can empty the wallet between the two — an under-funded pull reverts, and
  // the persisted-hash-before-PATCH ordering replays that revert on every resume. resolveOpenWalletPull
  // prices the pull off the open's `tokenInAmount` where the server states a real one, falling back to
  // a signed COLLATERAL permit and then to an unpriced empty-wallet floor. The permit is rarely the
  // source in practice — the backend signs collateral permits at the MaxUint160 allowance cap, which
  // that helper discards as a ceiling rather than a pull — though Permit2 still bounds the on-chain
  // transfer by it either way, so no server-composed calldata can exceed what this client signed. The
  // open's own calldata is deliberately not decoded — the client carries no position-call ABI (see
  // marginRouterAbi), and the router entrypoint varies by shape, so a "decode or block" rule would
  // reject legitimate opens rather than fail safe. Balance is read over the app's own (UniRPC)
  // transport, so this runs BEFORE the chain switch. INSUFFICIENT_SOURCE_FUNDS is the same typed code
  // the server stamps for this case; the copy is re-quote, never a resize. Returns the step error, or
  // undefined when it covers.
  const checkOpenCollateralBalance = useEvent(
    async ({
      plan,
      step,
      chainId,
    }: {
      plan: MarginPlanResponse
      step: MarginPlanStep
      chainId: number
    }): Promise<{ stepIndex: number; code: string; message: string } | undefined> => {
      // LIVE wagmi state, like every other fund-safety read in this loop — the render-captured
      // `account` can lag a switch. And a THROW, not a silent skip: absent an address this guard cannot
      // run at all, so returning undefined would wave the pre-broadcast balance check through. Same
      // retryable CLIENT_ERROR shape as the `!provider` leg below.
      const liveAddress = getAccount(wagmiConfig).address
      if (!liveAddress) {
        throw new Error('Wallet address unavailable')
      }
      const pull = resolveOpenWalletPull({ plan, step })
      if (pull.kind === 'native') {
        return undefined
      }
      const provider = clientToProvider(getClient(wagmiConfig, { chainId }), chainId)
      if (!provider) {
        // Transient: the chain's wagmi client isn't ready yet. Throw so this surfaces as a RETRYABLE
        // CLIENT_ERROR via runLoop's catch — never fail closed to the terminal CTA on a client hiccup.
        throw new Error('Margin-chain client unavailable')
      }
      const token = createContract({ address: getAddress(pull.token), abi: erc20Abi, provider })
      // The wallet that will actually SIGN, which is the balance that has to cover the pull.
      // Checked, not cast. The contract seam resolves an absent method to `undefined` rather than
      // throwing, and `undefined` makes BOTH legs of the decision false — under the amount and equal to
      // no floor — so an unchecked cast turns this fail-closed guard into a fail-open one. Throwing
      // lands on the same retryable CLIENT_ERROR as an unreachable provider.
      const raw = await token.read.balanceOf([liveAddress])
      if (typeof raw !== 'bigint') {
        throw new Error('Collateral balance unreadable')
      }
      const balance = raw
      if (!isOpenCollateralBalanceInsufficient({ balance, pull })) {
        return undefined
      }
      let symbol = pull.token
      try {
        symbol = (await token.read.symbol()) as string
      } catch {
        // keep the address fallback
      }
      return {
        stepIndex: step.stepIndex,
        code: 'INSUFFICIENT_SOURCE_FUNDS',
        message: t('margin.plan.collateralSpent', { symbol }),
      }
    },
  )

  // Surface a terminal plan's own step error. The backend stamps a STEP_ERROR atomically with the
  // FAILED status, but runLoop's while-condition exits before the top-of-loop scan can read it — so
  // without this the modal shows a Continue that re-enters and lands straight back on the same branch.
  const surfaceTerminalStepError = useEvent(({ plan, epoch }: { plan: MarginPlanResponse; epoch: number }) => {
    const failedStep = erroredStep(plan.steps)
    // Through erroredStepError so a step carrying a code but no detail still surfaces: requiring both
    // fields left the modal rendering the step list with no message and no CTA.
    //
    // And a plan-level fallback when NO step carries a code at all — a CANCELLED plan carries none, so
    // without this the same empty state returns by the other door. PLAN_TERMINAL is in
    // TERMINAL_STEP_ERROR_CODES, so the modal offers Restart rather than a Retry that would re-enter
    // and exit on the same status.
    // A terminal PLAN can carry a NON-terminal step code — PROOF_REVERIFY_FAILED is deliberately
    // excluded from TERMINAL_STEP_ERROR_CODES because it is retryable mid-run. Surfacing it verbatim
    // here offers Retry on a plan whose loop has already exited: retryCurrentStep → resumePlan → the
    // while is already false → straight back to this branch. Keep the step's own MESSAGE (it is the
    // specific one) and coerce only the code, so the CTA becomes Restart.
    const stepError = failedStep ? erroredStepError(failedStep) : undefined
    const error = stepError
      ? { ...stepError, code: isTerminalStepError(stepError.code) ? stepError.code : 'PLAN_TERMINAL' }
      : {
          stepIndex: 0,
          code: 'PLAN_TERMINAL',
          message:
            plan.status === 'CANCELLED' ? t('margin.plan.error.planCancelled') : t('margin.plan.error.planFailed'),
        }
    store.getState().actions.setStepError({ epoch, error })
  })

  // Named for its contract rather than its body: the epoch guard lives in the store action, which
  // drops a write from a superseded generation. Kept as a helper so the call sites read as intent.
  const clearCreateStashIfCurrent = useEvent(({ epoch }: { epoch: number }): void => {
    store.getState().actions.setLastCreateRequest({ request: undefined, epoch })
  })

  // Only the create-driven run owns the stash, and `providedEpoch` is what marks that run. Entered
  // from resumePlan the stash belongs to an UNRELATED pending create, and clearing it there would cost
  // that surface its Retry over a provider blip that has nothing to do with it.
  const clearCreateStashIfOwned = useEvent(({ epoch, owns }: { epoch: number; owns: boolean }): void => {
    if (owns) {
      clearCreateStashIfCurrent({ epoch })
    }
  })

  // The FAILED/CANCELLED counterpart to finalize (which is COMPLETED-only). Gated on supersession for
  // the same reason finalize is: a post-account-switch zombie tail can still reach a terminal status on
  // ITS local plan, and none of this cleanup is epoch-guarded at the store — upsertMarginPlanTransaction
  // reads the LIVE account for `from`, so wallet A's failed plan would otherwise file as an activity
  // row under wallet B while the clears below ran against A's keys.
  const abandonTerminalPlan = useEvent(({ plan, epoch }: { plan: MarginPlanResponse; epoch: number }) => {
    if (isRunSuperseded({ epoch, currentEpoch: store.getState().actions.currentEpoch() })) {
      return
    }
    // Drop the persisted proofs so a stale hash can never replay onto a later plan — but ONLY where
    // the failing step broadcast nothing. Read off the step's own errorCode rather than the store's:
    // surfaceTerminalStepError has not run yet, so gating on `stepError` here would find nothing and
    // clear unconditionally, silently defeating the guard restartPlan relies on.
    const failedStep = erroredStep(plan.steps)
    const abandonHasProof =
      failedStep !== undefined &&
      readStepProof({ swapper: plan.swapper, planId: plan.planId, stepIndex: failedStep.stepIndex }) !== undefined
    if (mayClearProofsOnAbandon({ code: failedStep?.errorCode, failingStepHasProof: abandonHasProof })) {
      clearPlanProofs({ swapper: plan.swapper, planId: plan.planId })
    }
    // The pointer goes for the same reason finalize clears one: its only job is the resume banner
    // (shouldShowPointerBanner is true for ANY pointer), so leaving it offers a resume for a plan that
    // can never advance — resumePlan GETs it fine, re-enters, and exits on the same terminal status.
    // Nothing is lost: the pending section's Cancel reads the SERVER's pendingPlans, not this pointer,
    // so a FAILED plan still holding a subId stays reachable.
    clearPointerIfOwned({ swapper: plan.swapper, planId: plan.planId })
    surfaceTerminalStepError({ plan, epoch })
    upsertMarginPlanTransaction({ plan })
  })

  // The supersession predicate, read from LIVE wagmi state rather than any captured closure — used at
  // the top of each loop iteration, immediately before a wallet prompt, and on the far side of the
  // create POST.
  const isSuperseded = useEvent((params: { epoch: number; planSwapper: string }) =>
    shouldAbortLoopIteration({
      epoch: params.epoch,
      currentEpoch: store.getState().actions.currentEpoch(),
      planSwapper: params.planSwapper,
      accountAddress: getAccount(wagmiConfig).address,
    }),
  )

  const runLoop = useEvent(
    async ({
      plan: initialPlan,
      createRequest,
      providedEpoch,
    }: {
      plan: MarginPlanResponse
      createRequest?: MarginCreatePlanRequest
      providedEpoch?: MarginAcquiredEpoch
    }): Promise<void> => {
      const { actions } = store.getState()
      // Single-flight lock: the acquired epoch stamps every write below so a superseded loop — one
      // whose reset/account-switch has since bumped the epoch — dies silently instead of clobbering
      // fresh state. Release happens in the finally.
      const epoch = acquireRunEpoch({ providedEpoch, planId: initialPlan.planId })
      if (epoch === undefined) {
        return
      }
      try {
        if (!walletProvider || !readProvider || !account.address) {
          // Same invariant as the create-time supersession exit: this throws BEFORE `setPlan`, so a
          // create that already succeeded lands in the catch with no plan in the store — and a stashed
          // request arms `canRetryCreate`, whose Retry would re-POST and mint a second plan and subId
          // while the first still holds its reservation. Recovery belongs to the persisted pointer.
          clearCreateStashIfOwned({ epoch, owns: providedEpoch !== undefined })
          throw new Error('Wallet not connected')
        }
        // Swapper↔account guard: a plan minted under a prior wallet must never be signed by the
        // current one (a backgrounded loop or a persisted-pointer resume can outlive the switch).
        // Deliberately the RENDER-CAPTURED account, not the live one: `isSuperseded` already refuses
        // the live mismatch at the top of every iteration, so a live read here would be a strict
        // subset of it. What this adds is the OTHER axis — a committed render pointing at a wallet
        // the plan does not belong to gets the named error instead of a silent bail.
        if (!isPlanForAccount({ planSwapper: initialPlan.swapper, accountAddress: account.address })) {
          // Precedes `setPlan` exactly as the connectivity exit above does, so it carries the same
          // obligation: leaving the stash arms `canRetryCreate` on the create-failure surface, and
          // that Retry re-POSTs the identical request — a second plan and subId while the first
          // still holds its reservation.
          clearCreateStashIfOwned({ epoch, owns: providedEpoch !== undefined })
          actions.setStepError({
            error: wrongAccountStepError(t),
            epoch,
          })
          return
        }
        actions.setPlan({ plan: initialPlan, epoch })
        actions.setStepError({ error: undefined, epoch })

        // Closing the steps modal backgrounds the run only until the NEXT wallet prompt: in-flight
        // work (mining/bridge polls, PATCH replays) still completes — a plan whose last step is
        // mining still auto-finalizes — but a prompt must never pop with no modal context. Park
        // exactly like a rejection: step stays AWAITING_ACTION, the finally releases the lock, and
        // the pending card / in-flight row owns the resume affordance. The invalidation surfaces
        // the card even when the plan was created after the last positions fetch.
        const parkIfModalClosed = (): boolean => {
          if (store.getState().isModalOpen) {
            return false
          }
          void queryClient.invalidateQueries({ queryKey: MARGIN_POSITIONS_QUERY_KEY })
          return true
        }
        // Everything that must stop a run between the top-of-iteration gate and a wallet prompt: the
        // modal closing (which parks the step) and supersession by an account switch or a newer run.
        const shouldStopBeforePrompt = (): boolean =>
          parkIfModalClosed() || isSuperseded({ epoch, planSwapper: initialPlan.swapper })

        let plan = initialPlan
        let stalledPolls = 0
        // Per-step chain switch + signer derivation happen inside the loop — the network can differ
        // per SEND_TX (a bridge deposit is signed on its source chain).
        while (!isTerminalPlanStatus(plan.status)) {
          // Re-checked at the TOP of EVERY iteration, not just loop entry: resetForAccount bumps the
          // epoch synchronously on a confirmed account switch, but THIS already-running async frame
          // doesn't see it until it next asks — before selectChain / signOrBroadcastStep / any wallet
          // prompt. getAccount(wagmiConfig) reads wagmi's LIVE imperative state, never this closure's
          // captured `account`, so a zombie loop from wallet A can't sign/broadcast a step composed
          // for A's plan under wallet B.
          if (isSuperseded({ epoch, planSwapper: plan.swapper })) {
            return
          }
          // Check EVERY step on EVERY refresh: regeneration-time STEP_ERRORs
          // (PRICE_DRIFT / INSUFFICIENT_BORROW_LIQUIDITY / GAS_ESTIMATION_REVERT)
          // land on the step being MATERIALIZED, not the one just PATCHed —
          // checking only the PATCHed step would leave the loop spinning on an
          // errored plan forever.
          const errored = plan.steps.find((s) => s.status === 'STEP_ERROR')
          if (errored) {
            sendAnalyticsEvent(InterfaceEventName.MarginPlanStepFailed, {
              intent: plan.intent,
              action: lastQuotedActionKey(),
              stepType: errored.stepType,
              stepIndex: errored.stepIndex,
              errorCode: errored.errorCode,
            })
            actions.setStepError({ error: erroredStepError(errored), epoch })
            return // plan is durable server-side; Retry resumes from here
          }
          const step = firstActionableStep(plan)
          if (!step) {
            // Poll a bridging step on the relaxed budget rather than counting it against the
            // stall cap (would false-fail a multi-minute fill).
            const bridging = findBridgingStep(plan)
            if (bridging) {
              plan = await pollBridgeStep({ planId: plan.planId, step: bridging, epoch })
              continue
            }
            // NOT_READY / IN_PROGRESS tail — wait for server regeneration.
            // Capped: an unmaterializable plan must surface, not spin.
            stalledPolls += 1
            if (stalledPolls > MAX_POLL_ATTEMPTS) {
              actions.setStepError({
                error: {
                  stepIndex: plan.currentStepIndex,
                  code: 'CLIENT_ERROR',
                  message: 'Plan stalled — retry',
                },
                epoch,
              })
              return
            }
            await sleep(POLL_INTERVAL_MS)
            plan = await MarginApiClient.getMarginPlan({ planId: plan.planId })
            store.getState().actions.setPlan({ plan, epoch })
            continue
          }
          // Dup guard: if this step already broadcast, reconcile its persisted proof
          // instead of re-prompting a second on-chain tx (double depositV3). Runs BEFORE the stall
          // reset so a non-advancing reconcile (terminal PATCH that didn't move the plan) counts
          // toward the cap + keeps the inter-iteration sleep, rather than hot-spinning GET+PATCH.
          const replayed = await replayPersistedProof({ plan, step, epoch })
          if (replayed !== 'proceed') {
            plan = replayed.plan
            const stall = decideReplayStall({
              advanced: replayed.advanced,
              stalledPolls,
              maxAttempts: MAX_POLL_ATTEMPTS,
            })
            stalledPolls = stall.stalledPolls
            if (stall.action === 'bail') {
              actions.setStepError({
                error: { stepIndex: plan.currentStepIndex, code: 'CLIENT_ERROR', message: 'Plan stalled — retry' },
                epoch,
              })
              return
            }
            if (stall.action === 'stall') {
              await sleep(POLL_INTERVAL_MS)
            }
            continue
          }
          stalledPolls = 0
          if (parkIfModalClosed()) {
            return
          }
          // The step's own chain: a SEND_TX runs on its payload chain (a bridge deposit and
          // a source-chain pre-swap are signed on their source chain); a SIGN_MSG permit is
          // validated + signed against its own domain chain.
          const stepChainId =
            step.method === 'SEND_TX' ? (step.payload as MarginTxStepPayload).chainId : signMsgChainId(step)
          // Same fail-closed shape for the wallet-funded open: the collateral it pulls sits in the
          // EOA between the pre-swap and this step, so it can be spent from under the plan.
          if (step.stepType === 'MARGIN_OPEN') {
            const insufficient = await checkOpenCollateralBalance({ plan, step, chainId: stepChainId })
            if (insufficient) {
              actions.setStepError({ error: insufficient, epoch })
              return
            }
          }
          // Switch to the step's own chain before prompting — for a SIGN_MSG as much as a SEND_TX, and
          // a no-op/early-true when the wallet is already there. Wallets validate a typed-data permit's
          // `domain.chainId` against the ACTIVE chain, so on a bridge-funded open the source-chain legs
          // leave the wallet elsewhere and the margin-chain permit is rejected outright — a CLIENT_ERROR
          // that Retry re-enters, because retrying does not move the wallet either.
          const switched = await selectChain(stepChainId as UniverseChainId)
          if (!switched) {
            // Refusal → step stays AWAITING_ACTION (mirrors a 4001 rejection).
            return
          }
          const signer = await getSignerForChain(stepChainId)
          // Re-check right before prompting. Four awaits sit between the top-of-iteration gate and
          // here — proof replay, the balance read, the selectChain network-switch prompt (which can
          // stay open for seconds) and the signer derivation — and neither the modal nor the account
          // is blocked during them. A mid-window account switch would otherwise resolve the signer to
          // B while `step`/`plan` are still A's, and a MARGIN_PRE_SWAP pins its recipient to A. Nothing
          // is broadcast yet, so parking here is as safe as a 4001 rejection.
          if (shouldStopBeforePrompt()) {
            return
          }
          const signed = await signOrBroadcastStep({
            plan,
            step,
            signer,
            epoch,
          })
          if (signed === 'rejected') {
            return
          }
          const proof = signed.proof
          // Keep the TransactionType.Margin* activity rows.
          if (proof.txHash) {
            const activityInfo = buildStepActivityInfo({ plan, step, createRequest })
            if (activityInfo) {
              addTransaction(
                { hash: proof.txHash, chainId: (step.payload as MarginTxStepPayload).chainId },
                activityInfo,
              )
            }
          }
          plan = await submitStepProof({ planId: plan.planId, stepIndex: step.stepIndex, proof })
          store.getState().actions.setPlan({ plan, epoch })
          plan = await pollForStep({ plan, step, epoch })
          // No per-step error check here: the top-of-loop scan surfaces a
          // STEP_ERROR on the PATCHed step AND on any step the PATCH
          // re-materialized, uniformly.
        }
        if (plan.status === 'COMPLETED') {
          await finalize({ plan, epoch })
        } else {
          abandonTerminalPlan({ plan, epoch })
        }
      } catch (error) {
        const message = toPlanErrorMessage(error)
        const current = store.getState().plan
        store.getState().actions.setStepError({
          error: {
            stepIndex: current ? (firstActionableStep(current)?.stepIndex ?? current.currentStepIndex) : 0,
            code: 'CLIENT_ERROR',
            message,
          },
          epoch,
        })
        logger.error(error, { tags: { file: 'useExecuteMarginPlan', function: 'runLoop' } })
      } finally {
        store.getState().actions.releaseExecution({ epoch })
      }
    },
  )

  const executePlan = useEvent(
    async ({
      request,
      action,
      venuePreference,
    }: {
      request: MarginCreatePlanRequest
      action?: MarginManageAction
      venuePreference?: MarginVenuePreference
    }): Promise<void> => {
      // Acquire the single-flight lock BEFORE the subId-minting create POST. A racing/double-clicked
      // second call bails here — it MUST NOT mint a second subId or clobber the persisted pointer /
      // form state of the running plan. tryAcquireExecution bumps the epoch, so this runs under the
      // generation it acquired (no separate reset()).
      const { acquired, epoch } = store.getState().actions.tryAcquireExecution({ planId: 'PENDING_CREATE' })
      if (!acquired) {
        return
      }
      const { actions } = store.getState()
      // Clear a prior COMPLETED run's lingering plan + error so the create round-trip spinner and the
      // create-failure surface (both gated on `!plan`) render correctly.
      actions.setPlan({ plan: undefined, epoch })
      actions.setStepError({ error: undefined, epoch })
      actions.setModalOpen(true)
      // Stashed so the create-failure CTA can retry with the exact same request.
      actions.setLastCreateRequest({ request, epoch })
      // Set unconditionally: a non-ADJUST run must clear the previous run's action, not inherit it.
      actions.setLastManageAction(action)
      // Everything between the acquire and the runLoop handoff runs under this guard: any throw here
      // (create POST, or an unexpected persist/form failure) MUST release the lock — runLoop's own
      // finally never fires when it isn't reached, so an unguarded throw would strand the lock forever
      // (every later Open/resume/retry would silently bail at !acquired).
      let plan: MarginPlanResponse
      // The POST is the point of no return: every line after it runs with a plan already minted and
      // holding its subId. A throw past that point must not leave the create stashed — `canRetryCreate`
      // would re-POST the identical request and mint a SECOND plan and subId, and the re-persist would
      // overwrite the first plan's only resume pointer. Same reason both sibling exits clear it.
      let planMinted = false
      try {
        plan = await MarginApiClient.createMarginPlan(request)
        planMinted = true
        // The routed venue is position identity from here on — selection ran once, at quote, and no
        // re-materialization may change it.
        sendAnalyticsEvent(InterfaceEventName.MarginPlanCreated, {
          intent: plan.intent,
          action: request.marginQuote?.action,
          venue: request.marginQuote?.legs[0]?.venue ?? plan.venue,
          allowlistSent: venuePreference?.allowlistSent,
          excludedCount: venuePreference?.excludedCount,
        })
        // Keyed on the PLAN's swapper, so it is written under whoever the plan belongs to and is safe
        // — and necessary — even if the wallet has since changed: it is the only thing giving that
        // wallet a resume affordance for a plan already holding a subId reservation. Hoisted above the
        // supersession check for exactly that reason.
        persistPlanId({ swapper: plan.swapper, planId: plan.planId, intent: plan.intent })
        // The create POST is the one long await with no supersession check on its far side. A wallet
        // switch mid-POST bumps the epoch, and the two writes below are not epoch-guarded:
        // upsertMarginPlanTransaction reads the LIVE account for `from`, so A's plan would file as an
        // activity row under B, and the form would point B at a plan it cannot sign.
        if (isSuperseded({ epoch, planSwapper: plan.swapper })) {
          // This exit leaves no plan in the store, so the modal is sitting on its create-round-trip
          // spinner. Give it the create-failure surface (message + Close) or the spinner runs forever:
          // on the transient-blip leg resetForAccount deliberately does not reset, so nothing else
          // would ever take it down. The copy is the same one the loop's own swapper guard uses — the
          // plan exists and belongs to the previous wallet, and its pointer was persisted above, so
          // reconnecting that wallet offers the resume.
          // The stash MUST go with it. It exists so a create that FAILED can be re-POSTed, and this
          // create SUCCEEDED — the plan is minted, persisted and holding its subId. Leaving it stashed
          // arms `canRetryCreate`, and on the transient-blip leg (where resetForAccount deliberately
          // does not reset) the same wallet reconnecting would re-POST the identical request and mint a
          // SECOND plan and subId. Recovery here belongs to the persisted pointer, not to Retry.
          clearCreateStashIfCurrent({ epoch })
          actions.setStepError({
            error: wrongAccountStepError(t),
            epoch,
          })
          // The lock must be released on THIS exit too, not just the throw path. `isSuperseded` is
          // also true for a transient undefined address (a wallet lock or provider reconnect), and
          // resetForAccount deliberately ignores that case — so nothing else would ever release it and
          // every later Open/resume/retry would silently bail at `!acquired`.
          actions.releaseExecution({ epoch })
          return
        }
        setMarginFormState({ activePlanId: plan.planId })
        upsertMarginPlanTransaction({ plan })
      } catch (error) {
        if (planMinted) {
          clearCreateStashIfCurrent({ epoch })
        }
        // Create-time failures (typed 400 echo-drift, 422 liquidity, or network) MUST
        // surface in the already-open modal: callers invoke `void executePlan(...)`, so a
        // rejection here would otherwise be unhandled and the modal would render nothing.
        const body =
          error instanceof FetchError ? (error.data as { errorCode?: string; detail?: string } | undefined) : undefined
        // Shared reasons (health-floor, etc.) get the same localized copy as the adjust preview;
        // create-only codes (not yet in the map) keep the existing detail/message fallback.
        const mappedMessage = body?.errorCode
          ? getMappedMarginErrorMessage({ errorCode: body.errorCode, detail: body.detail, t })
          : undefined
        actions.setStepError({
          error: {
            // Plan-level: the create never returned a plan, so the 0 names no step.
            stepIndex: 0,
            namesStep: false,
            code: body?.errorCode ?? 'PLAN_CREATE_FAILED',
            message:
              mappedMessage ?? body?.detail ?? (error instanceof Error ? error.message : 'Could not create plan'),
          },
          epoch,
        })
        actions.releaseExecution({ epoch })
        return
      }
      // From here runLoop owns the lock and releases it in its own finally.
      await runLoop({ plan, createRequest: request, providedEpoch: epoch })
    },
  )

  const resumePlan = useEvent(async ({ planId }: { planId: string }): Promise<void> => {
    const epoch = store.getState().actions.currentEpoch()
    // resumePlan BORROWS the current epoch — it never acquires one (runLoop does, later). So every
    // store write below would pass the store's epoch-equality guard while actually landing on whichever
    // run is live: a blip to an undefined address while run A executes would otherwise stamp A's modal
    // with a WRONG_ACCOUNT error and take away its Continue, with A still running normally. Write only
    // when nothing is executing, or when the live run IS this plan's.
    const mayWrite = (): boolean => {
      const executingPlanId = store.getState().executingPlanId
      return executingPlanId === undefined || executingPlanId === planId
    }
    if (mayWrite()) {
      // The quoted action key describes the run that MINTED it. A retry resumes the plan already in the
      // store and must keep it — that is the whole point of the field outliving the create stash — but a
      // pointer-banner resume can pick up an entirely different plan, one this session never quoted, and
      // the key must not follow it there or that plan's step analytics report the previous run's action.
      //
      // Inside mayWrite for the same reason every other write here is: a resume the lock rejects must
      // not touch the LIVE run's state. Mid-create the banner is eligible while `plan` is still
      // undefined, so an unguarded clear would wipe the key executePlan had just stamped.
      if (store.getState().plan?.planId !== planId) {
        store.getState().actions.clearLastQuotedAction()
      }
      store.getState().actions.setModalOpen(true)
    }
    let plan: MarginPlanResponse
    try {
      plan = await MarginApiClient.getMarginPlan({ planId })
    } catch (error) {
      if (is404Error(error)) {
        // Plan expired (record TTL) or the stores were reset — clear the stale pointer
        // or the resume banner persists forever, pointing at nothing.
        if (account.address) {
          // Keyed on the connected account, which is the address this resume looked the pointer up
          // under — the 404'd plan is gone, so its swapper is unavailable.
          clearPointerIfOwned({ swapper: account.address, planId })
          // Same TTL: drop the expired plan's persisted proofs so they never replay onto a new plan.
          clearPlanProofs({ swapper: account.address, planId })
        }
        // The clears above are keyed to the EXPIRED plan and are always safe. Everything below writes
        // the CURRENT UI, so it belongs to whoever owns the run: mid-create the store holds no plan, so
        // an ungated `else` here would close the live create's modal — which parks its just-minted plan
        // — blank its activePlanId, and toast "expired" about a plan the user was never looking at.
        if (mayWrite()) {
          setMarginFormState({ activePlanId: undefined })
          // The plan itself must go, not just its pointer: `useIsPlanInFlight` is
          // `plan !== undefined && !isTerminalPlanStatus(plan.status)`, and an expired plan is stuck
          // mid-run — so leaving it in the store locks EVERY management CTA (close, add, withdraw) for
          // a user holding a live position, with no exit but a reload. Scoped to this plan so a resume
          // of an expired record cannot reset a different run that is executing normally.
          if (store.getState().plan?.planId === planId) {
            store.getState().actions.reset()
          } else {
            store.getState().actions.setModalOpen(false)
          }
          popupRegistry.addPopup(
            { type: PopupType.Error, error: t('margin.plan.expired') },
            `margin-plan-expired-${planId}`,
          )
        }
        return
      }
      const body =
        error instanceof FetchError ? (error.data as { errorCode?: string; detail?: string } | undefined) : undefined
      const mappedMessage = body?.errorCode ? getMappedMarginErrorMessage({ errorCode: body.errorCode, t }) : undefined
      if (!mayWrite()) {
        return
      }
      // The stash goes with it. A create failure and a resume failure render the SAME surface
      // (`!plan && stepError`), and the stash is what arms its Retry — so a stash left over from an
      // earlier create would offer "Retry create" on top of a resume error, and pressing it re-POSTs
      // the stale request: a second plan and subId, minted through the resume door, which is the
      // double-mint class the create-path exits are hardened against. Nothing is lost — that create
      // minted nothing, and the form can open it again.
      clearCreateStashIfCurrent({ epoch })
      store.getState().actions.setStepError({
        error: {
          // Plan-level: the GET failed, so nothing is known about any individual step.
          stepIndex: 0,
          namesStep: false,
          code: body?.errorCode ?? 'PLAN_RESUME_FAILED',
          message: mappedMessage ?? body?.detail ?? (error instanceof Error ? error.message : 'Could not resume plan'),
        },
        epoch,
      })
      return
    }
    // Same window the create path guards on the far side of ITS long await: both writes below are
    // cross-wallet — upsertMarginPlanTransaction files the row under the LIVE account, and
    // setMarginFormState points the current form at this plan — and neither is epoch-guarded at the
    // store. runLoop re-checks for itself, so this only has to cover the two writes.
    if (isSuperseded({ epoch, planSwapper: plan.swapper })) {
      // NO releaseExecution here, unlike the create path's twin: resumePlan never ACQUIRES the lock —
      // runLoop does, later, and releases it in its own finally. `epoch` here is `currentEpoch()`, i.e.
      // whatever generation is live, and releaseExecution checks epoch equality only — so releasing on
      // it would free a lock owned by a DIFFERENT running loop and let the next Open mint a second plan
      // and subId. Surface the reason instead, or the modal sits on an empty spinner with no CTA.
      if (mayWrite()) {
        store.getState().actions.setStepError({ error: wrongAccountStepError(t), epoch })
      }
      return
    }
    // Both are cross-run writes, like every other one in this function: upsertMarginPlanTransaction
    // files the row under the LIVE account and setMarginFormState repoints the CURRENT form. With
    // another run holding the lock, runLoop below no-ops at tryAcquireExecution — so without this the
    // live run keeps executing while `activePlanId` names a different plan.
    if (mayWrite()) {
      // From here this resume owns the surface, so a stash from an earlier failed create is stale —
      // and `runLoop` below is entered OUTSIDE the try above, so its connectivity guard throws before
      // `setPlan` and its catch renders the same `!plan && stepError` surface. Retry would then re-POST
      // that stale request, minting a second plan and subId while the resumed plan holds its
      // reservation: the double-mint the GET-error exit above closes, one door over.
      clearCreateStashIfCurrent({ epoch })
      setMarginFormState({ activePlanId: plan.planId })
      upsertMarginPlanTransaction({ plan })
    }
    await runLoop({ plan })
  })

  const retryCurrentStep = useEvent(async (): Promise<void> => {
    const plan = store.getState().plan
    if (plan) {
      await resumePlan({ planId: plan.planId })
    }
  })

  // The terminal-code counterpart to retryCurrentStep. A TERMINAL step error (e.g.
  // PROOF_UNRECOVERABLE — a mainnet broadcast tx that may have already succeeded on-chain despite
  // failing re-verification) must never be retried, so this clears the persisted pointer + the whole
  // store instead and returns the user to the form. Positions are refreshed so a tx that DID land
  // on-chain shows up before the user opens anything new.
  const restartPlan = useEvent((): void => {
    const { plan, stepError } = store.getState()
    if (plan) {
      clearPointerIfOwned({ swapper: plan.swapper, planId: plan.planId })
      // Only where the failing step broadcast nothing. Dropping the pointer alone would otherwise
      // leave the plan with no affordance — the orphaned proof keeps `hasUnlandedLocalProof` set,
      // which withholds the pending card's Cancel — but for a code whose tx may have LANDED that
      // suppression is the point: cancelling a plan with a live deposit, or resuming one whose only
      // local proof is gone, is worse than waiting out the cache TTL.
      // The proof is checked as well as the code: a re-materialized step that already broadcast keeps
      // its evidence regardless of what the terminal code promises.
      const failingStepHasProof =
        stepError !== undefined &&
        readStepProof({ swapper: plan.swapper, planId: plan.planId, stepIndex: stepError.stepIndex }) !== undefined
      if (mayClearProofsOnAbandon({ code: stepError?.code, failingStepHasProof })) {
        clearPlanProofs({ swapper: plan.swapper, planId: plan.planId })
        // Same predicate, same reason — and the reservation has to go with the proofs. The one path
        // that mints a terminal error while the SERVER plan is still live is the client-side balance
        // guard (INSUFFICIENT_SOURCE_FUNDS on MARGIN_OPEN): the server never learns the step failed, so
        // the subId stays reserved and the follow-up create this button sends the user to 409s until
        // the TTL expires — with the pointer already gone. Best-effort: a failed cancel must not block
        // the restart, and the codes that keep their proofs keep their suppression here too.
        if (!isTerminalPlanStatus(plan.status)) {
          void MarginApiClient.cancelMarginPlan({ planId: plan.planId }).catch((error: unknown) => {
            logger.warn('useExecuteMarginPlan', 'restartPlan', 'Failed to cancel the restarted plan', error)
          })
        }
      }
    }
    store.getState().actions.reset()
    setMarginFormState({ activePlanId: undefined, marginAmount: '' })
    void queryClient.invalidateQueries({ queryKey: MARGIN_POSITIONS_QUERY_KEY })
  })

  return { executePlan, resumePlan, retryCurrentStep, restartPlan }
}
