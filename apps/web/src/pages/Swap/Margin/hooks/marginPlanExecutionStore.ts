import { areAddressesEqual } from '@universe/chains'
import { isDevEnv } from '@universe/environment'
import type {
  MarginActionKey,
  MarginCreatePlanRequest,
  MarginPlanResponse,
} from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import type { MarginManageAction } from 'uniswap/src/features/transactions/margin/types'
import { useStore } from 'zustand'
import { devtools } from 'zustand/middleware'
import { createStore } from 'zustand/vanilla'
import { MARGIN_CHAIN_ID } from '~/constants/margin'

// The epoch a frame actually ACQUIRED the run lock under. Branded so it can only be minted by
// tryAcquireExecution: releaseExecution takes this type, so a frame holding a merely-observed epoch
// from currentEpoch() cannot compile a call that frees a lock owned by a different loop.
export type MarginAcquiredEpoch = number & { readonly __marginAcquiredEpoch: unique symbol }

export interface MarginPlanExecutionState {
  plan?: MarginPlanResponse
  isModalOpen: boolean
  // Dismissal blocked while a wallet prompt is up.
  isWalletPromptOpen: boolean
  // Cosmetic mirror of the lock — driven by acquire/release, read by the review modal.
  isExecuting: boolean
  // `namesStep: false` marks a PLAN-level failure whose `stepIndex` is a placeholder 0 — nothing
  // failed on step 0. Set only by the mints that are unconditionally plan-level; the code alone
  // cannot carry this, because a create/resume failure forwards the SERVER's errorCode verbatim.
  // (The PLAN_TERMINAL sentinel is minted conditionally and is recognised by predicate instead.)
  stepError?: { stepIndex: number; code: string; message: string; namesStep?: false }
  // Single-flight lock: the planId that owns the executor loop, or undefined when idle.
  executingPlanId?: string
  // Bumped on every reset/account-switch. A loop captures the epoch at acquire time; its later
  // store writes are dropped once the epoch moves on — the AbortController-equivalent.
  epoch: number
  // The request behind the current/last create() call — lets the create-failure CTA (no plan yet)
  // retry with the same request instead of bouncing the user back to the form.
  lastCreateRequest?: MarginCreatePlanRequest
  // The ten-key the current/last run was QUOTED under, for the analytics the run keeps emitting. Its
  // own field because it outlives the stash above: a retry drops that stash as soon as it takes over
  // the surface, while every remaining step of the run still has to name what was quoted. Same
  // lifetime as lastManageAction — cleared by reset, never by a stash clear.
  lastQuotedAction?: MarginActionKey
  // Which user action minted the current/last run. Add margin, Withdraw margin and Change leverage all
  // send intent: 'ADJUST', so the plan cannot name what the user did — the completion toast reads this.
  lastManageAction?: MarginManageAction
  actions: {
    setPlan: (params: { plan?: MarginPlanResponse; epoch: number }) => void
    setModalOpen: (open: boolean) => void
    // Epoch-guarded (fund-safety): a superseded/zombie loop must never pin the wallet-prompt
    // modal open under a newer run's UI.
    setWalletPromptOpen: (params: { open: boolean; epoch: number }) => void
    setStepError: (params: { error?: MarginPlanExecutionState['stepError']; epoch: number }) => void
    // Epoch-guarded like its siblings: clearing this can reach across generations — wallet A's POST
    // resolving after a confirmed switch to B would wipe B's stash and leave B's create-failure surface
    // with no Retry.
    setLastCreateRequest: (params: { request?: MarginCreatePlanRequest; epoch: number }) => void
    setLastManageAction: (action?: MarginManageAction) => void
    // Cleared on a handoff to a plan this session never quoted — see resumePlan.
    clearLastQuotedAction: () => void
    // Returns the acquired epoch so the loop can stamp every subsequent write with it.
    // A FAILED acquire deliberately carries no epoch. The live epoch belongs to whichever loop holds
    // the lock, so handing it to a caller that did not acquire would let it release someone else's.
    tryAcquireExecution: (params: {
      planId: string
    }) => { acquired: true; epoch: MarginAcquiredEpoch } | { acquired: false; epoch?: undefined }
    releaseExecution: (params: { epoch: MarginAcquiredEpoch }) => void
    currentEpoch: () => number
    // Account switch/disconnect: drop the plan + lock unless the new address still owns it.
    resetForAccount: (params: { address?: string }) => void
    reset: () => void
  }
}

const INITIAL = {
  plan: undefined,
  isModalOpen: false,
  isWalletPromptOpen: false,
  isExecuting: false,
  stepError: undefined,
  executingPlanId: undefined,
  lastCreateRequest: undefined,
  lastQuotedAction: undefined,
  lastManageAction: undefined,
}

// Module scope on purpose, unlike the feature's form store: the run lock and the epoch have to
// outlive the review modal's mount, and surfaces outside any provider (the pending-plan card) read
// them through getState().
export const marginPlanExecutionStore = createStore<MarginPlanExecutionState>()(
  devtools(
    (set, get) => ({
      ...INITIAL,
      epoch: 0,
      actions: {
        setPlan: ({ plan, epoch }) => {
          if (epoch !== get().epoch) {
            return
          }
          set({ plan })
        },
        setModalOpen: (isModalOpen) => set({ isModalOpen }),
        setWalletPromptOpen: ({ open, epoch }) => {
          if (epoch !== get().epoch) {
            return
          }
          set({ isWalletPromptOpen: open })
        },
        setStepError: ({ error, epoch }) => {
          if (epoch !== get().epoch) {
            return
          }
          set({ stepError: error })
        },
        setLastCreateRequest: ({ request, epoch }) => {
          if (epoch !== get().epoch) {
            return
          }
          // Stamped together, dropped apart: clearing the stash must not take the quoted key with it.
          set(
            request
              ? { lastCreateRequest: request, lastQuotedAction: request.marginQuote?.action }
              : { lastCreateRequest: undefined },
          )
        },
        setLastManageAction: (lastManageAction) => set({ lastManageAction }),
        clearLastQuotedAction: () => set({ lastQuotedAction: undefined }),
        tryAcquireExecution: ({ planId }) => {
          const { executingPlanId, epoch } = get()
          if (executingPlanId !== undefined) {
            return { acquired: false }
          }
          // Acquiring opens a fresh generation: bump the epoch so any zombie loop still stamping the
          // prior epoch has its writes dropped. The returned epoch is the one the caller runs under.
          const nextEpoch = (epoch + 1) as MarginAcquiredEpoch
          set({ executingPlanId: planId, isExecuting: true, epoch: nextEpoch })
          return { acquired: true, epoch: nextEpoch }
        },
        releaseExecution: ({ epoch }) => {
          if (epoch !== get().epoch) {
            return
          }
          set({ executingPlanId: undefined, isExecuting: false })
        },
        currentEpoch: () => get().epoch,
        resetForAccount: ({ address }) => {
          const { plan, lastCreateRequest } = get()
          // The owner to protect: the plan's swapper, or — a create THAT FAILED never mints a plan —
          // the swapper on the stashed create-failure request. Without the lastCreateRequest fallback,
          // a create-failure surface (lastCreateRequest + stepError + open modal) would survive a
          // wallet switch, and its Retry would re-mint/execute a plan for the OLD swapper under the
          // NEW wallet. Nothing to protect, or a transient defined→undefined blip
          // (wallet-lock / provider reconnect): do NOT abort. Only a confirmed switch to a DIFFERENT
          // non-empty wallet clears it.
          const owner = plan?.swapper ?? lastCreateRequest?.swapper
          if (!owner || !address) {
            return
          }
          const sameOwner = areAddressesEqual({
            addressInput1: { address, chainId: MARGIN_CHAIN_ID },
            addressInput2: { address: owner, chainId: MARGIN_CHAIN_ID },
          })
          if (!sameOwner) {
            get().actions.reset()
          }
        },
        reset: () => set((state) => ({ ...INITIAL, epoch: state.epoch + 1 })),
      },
    }),
    { name: 'marginPlanExecutionStore', enabled: isDevEnv() },
  ),
)

export function useMarginPlanExecution<T>(selector: (state: MarginPlanExecutionState) => T): T {
  return useStore(marginPlanExecutionStore, selector)
}
