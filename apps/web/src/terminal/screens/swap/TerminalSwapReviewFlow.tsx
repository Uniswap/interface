/**
 * HookSwap Terminal — B8 confirm flow.
 *
 * A faithful MIRROR of the interface's `SwapFlow.tsx` body, EXCEPT it renders the
 * caller's bespoke Terminal swap "ticket" (`children`) in place of the stock
 * `<SwapFormScreen/>`, while still mounting the REAL review→confirm→submit modal
 * exactly like `CurrentScreen.web.tsx`.
 *
 * The point: we keep our custom order ticket UI but reuse Uniswap's untouched
 * review/execution pipeline (`SwapReviewScreen` + its stores + `usePrepareSwap`).
 * We reimplement NO approval / permit2 / submit logic — only the form UI differs.
 *
 * ── How the caller wires this up ────────────────────────────────────────────
 *   <TerminalSwapReviewFlow onSubmitSwap={...}>
 *     <SwapTicket />            // your bespoke ticket, rendered where the form was
 *   </TerminalSwapReviewFlow>
 *
 * The ticket's "Swap" button must trigger review via `useTerminalReviewTrigger()`
 * (exported below). That hook calls `useOnReviewPress()`, which requires the
 * `SwapFormWarningStoreContextProvider` this component mounts around `children` —
 * so the hook MUST be called from a component rendered INSIDE `children`, not from
 * the ticket's parent. See `useTerminalReviewTrigger`'s doc comment.
 *
 * ── Provider tree mounted here (order mirrors SwapFlow.tsx EXACTLY) ──────────
 *   1. <TransactionModal modalName=Swap>        — provides TransactionModalContext
 *        (screen/setScreen) + SwapFlowTimerContext. `setScreen(Review)` from the
 *        review pipeline and the `screen===Review` gate below read this SAME ctx.
 *   2. <TransactionSettingsStoreContext.Provider> — settings store (grabbed OUTSIDE
 *        the modal via useGetTransactionSettingsContextValue; re-provided inside so
 *        the tree still resolves it — matches SwapFlow's portal-safety pattern).
 *   3. <SwapFormStoreContext.Provider>          — the live swap-form store instance
 *        (same store the ticket already reads; re-provided inside the modal tree).
 *   4. <SwapTxStoreContextProvider>             — tx/gas store; placed ABOVE the deps
 *        store exactly as SwapFlow does (it does NOT depend on deps store).
 *   5. <SwapDependenciesStoreContext.Provider>  — swap dependencies (handlers/service).
 *   6. body (<TerminalCurrentScreen>):
 *        • <ActivePlanUpdater/>                 — same as SwapFlow.
 *        • <SwapFormWarningStoreContextProvider> wrapping {children} — SwapFormScreen
 *          normally provides this; since we drop SwapFormScreen we must add it so the
 *          ticket's review trigger (useOnReviewPress → useSwapFormWarningStoreActions)
 *          resolves. Sibling to the review modal, exactly like the real form is.
 *        • the review modal block, copied verbatim from CurrentScreen.web.tsx
 *          (SwapReviewScreenProviders + Modal gated on screen===Review + SwapReviewScreen).
 *
 * TokenSelectorHoverConfigProvider (present in SwapFlow) is intentionally OMITTED:
 * `useTokenSelectorHoverConfig()` returns `undefined` with no provider (safe), the
 * SwapReviewScreen does not consume it, and the ticket renders its own
 * SwapTokenSelector at the SwapScreen level. Adding it is unnecessary for compile
 * or runtime here.
 *
 * onClose: includes SwapFlow's real `useSwapFlowOnClose` cleanup (background/reset the
 * active plan + dispatch signalSwapModalClosed) for fidelity — NOT a bare noop.
 */
import type { ReactNode } from 'react'
import { useEffect, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { isWebApp } from '@universe/environment'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName, SectionName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import {
  TransactionSettingsStoreContext,
  useGetTransactionSettingsContextValue,
} from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/TransactionSettingsStoreContext'
import { TransactionModal } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModal'
import {
  TransactionScreen,
  useTransactionModalContext,
} from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { SwapFormWarningStoreContextProvider } from 'uniswap/src/features/transactions/swap/form/stores/swapFormWarningStore/SwapFormWarningStoreContextProvider'
import { useOnReviewPress } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useOnReviewPress'
import { useSwapOnPrevious } from 'uniswap/src/features/transactions/swap/review/hooks/useSwapOnPrevious'
import {
  SwapReviewScreen,
  SwapReviewScreenProviders,
} from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/SwapReviewScreen'
import { activePlanStore } from 'uniswap/src/features/transactions/swap/review/stores/activePlan/activePlanStore'
import { ActivePlanUpdater } from 'uniswap/src/features/transactions/swap/review/stores/activePlan/ActivePlanUpdater'
import { SwapDependenciesStoreContext } from 'uniswap/src/features/transactions/swap/stores/swapDependenciesStore/SwapDependenciesStoreContext'
import { useSwapDependenciesStoreBase } from 'uniswap/src/features/transactions/swap/stores/swapDependenciesStore/useSwapDependenciesStore'
import type { SwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/createSwapFormStore'
import { SwapFormStoreContext } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/SwapFormStoreContext'
import { useSwapFormStore, useSwapFormStoreBase } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { SwapTxStoreContextProvider } from 'uniswap/src/features/transactions/swap/stores/swapTxStore/SwapTxStoreContextProvider'
import { SwapFlowTimer } from 'uniswap/src/features/transactions/swap/utils/SwapFlowTimer'
import { signalSwapModalClosed } from 'uniswap/src/utils/saga'
import { DDRumManualTiming } from 'utilities/src/logger/datadog/datadogEvents'
import { useEvent } from 'utilities/src/react/hooks'

/**
 * Replicated verbatim from SwapFlow.tsx's local `useSwapFlowOnClose` (it isn't
 * exported). Backgrounds/resets the active plan and signals the swap modal closed.
 */
function useSwapFlowOnClose({
  onClose,
  swapFormStore,
}: {
  onClose: (() => void) | undefined
  swapFormStore: SwapFormStore
}): () => void {
  const dispatch = useDispatch()

  const cleanup = useEvent(() => {
    const isSubmitting = swapFormStore.getState().isSubmitting
    const { activePlan } = activePlanStore.getState()

    if (activePlan) {
      if (isSubmitting) {
        activePlanStore.getState().actions.backgroundPlan(activePlan.planId)
      }
      activePlanStore.getState().actions.resetActivePlan()
    }

    dispatch(signalSwapModalClosed())
  })

  return useEvent(() => {
    cleanup()
    onClose?.()
  })
}

/**
 * The in-modal screen body — mirrors `CurrentScreen.web.tsx` but renders `children`
 * (the bespoke ticket) instead of `<SwapFormScreen/>`, and wraps that ticket in the
 * `SwapFormWarningStoreContextProvider` the real form used to provide.
 *
 * Everything here runs INSIDE `TransactionModal`, so `useTransactionModalContext`,
 * `useSwapFormStore`, and `useSwapOnPrevious` all resolve against the modal's fresh
 * TransactionModalContext + the re-provided swap-form store.
 */
function TerminalCurrentScreen({
  children,
  onSubmitSwap,
}: {
  children: ReactNode
  onSubmitSwap?: () => Promise<void> | void
}): JSX.Element {
  const { screen } = useTransactionModalContext()
  const isSubmitting = useSwapFormStore((s) => s.isSubmitting)
  const { onPrev } = useSwapOnPrevious()

  return (
    <>
      <ActivePlanUpdater />

      {/*
        The bespoke ticket. Wrapped in SwapFormWarningStoreContextProvider so that a
        component inside `children` can call `useTerminalReviewTrigger()` /
        `useOnReviewPress()` (which reads the swap-form warning store) to launch review.
      */}
      <SwapFormWarningStoreContextProvider>{children}</SwapFormWarningStoreContextProvider>

      {/*
        Review modal block — copied verbatim from CurrentScreen.web.tsx. We render the
        `Modal` from the start (so the tamagui open animation runs when isModalOpen
        flips true) but only mount `SwapReviewScreen` once we're actually on Review.
      */}
      <SwapReviewScreenProviders hideContent={false} onSubmitSwap={onSubmitSwap}>
        <Modal
          height="auto"
          alignment={isWebApp ? 'center' : 'top'}
          isModalOpen={screen === TransactionScreen.Review}
          isDismissible={!isSubmitting}
          name={ModalName.SwapReview}
          padding="$spacing12"
          gap={0}
          onClose={onPrev}
        >
          {screen === TransactionScreen.Review && (
            <Trace logImpression section={SectionName.SwapReview}>
              <SwapReviewScreen />
            </Trace>
          )}
        </Modal>
      </SwapReviewScreenProviders>
    </>
  )
}

export function TerminalSwapReviewFlow({
  children,
  onSubmitSwap,
}: {
  children: ReactNode
  onSubmitSwap?: () => void | Promise<void>
}): JSX.Element {
  // Grab the current store instances OUTSIDE the modal, then re-provide them inside —
  // exactly as SwapFlow does (rendering within the modal creates a separate subtree).
  const transactionSettingsContext = useGetTransactionSettingsContextValue()
  const swapDependenciesStore = useSwapDependenciesStoreBase()
  const swapFormStore = useSwapFormStoreBase()
  const closeAndCleanUp = useSwapFlowOnClose({ onClose: undefined, swapFormStore })

  const tracker = useMemo(() => new SwapFlowTimer(), [])

  useEffect(() => {
    tracker.mark(DDRumManualTiming.SwapModalOpen)
    return () => tracker.dispose()
  }, [tracker])

  return (
    <TransactionModal modalName={ModalName.Swap} swapFlowTimer={tracker} onClose={closeAndCleanUp}>
      {/* Re-create providers inside the modal subtree (mirror of SwapFlow.tsx). */}
      <TransactionSettingsStoreContext.Provider value={transactionSettingsContext}>
        <SwapFormStoreContext.Provider value={swapFormStore}>
          <SwapTxStoreContextProvider>
            <SwapDependenciesStoreContext.Provider value={swapDependenciesStore}>
              <TerminalCurrentScreen onSubmitSwap={onSubmitSwap}>{children}</TerminalCurrentScreen>
            </SwapDependenciesStoreContext.Provider>
          </SwapTxStoreContextProvider>
        </SwapFormStoreContext.Provider>
      </TransactionSettingsStoreContext.Provider>
    </TransactionModal>
  )
}

/**
 * Trigger the REAL review pipeline (`usePrepareSwap` → sets screen = Review + prefetches
 * the plan) from the bespoke ticket's Swap button.
 *
 * IMPORTANT: this hook calls `useOnReviewPress()`, which reads the swap-form warning
 * store. It therefore MUST be called from a component rendered INSIDE
 * `TerminalSwapReviewFlow`'s `children` (which this file wraps in
 * `SwapFormWarningStoreContextProvider`). Calling it from a component rendered OUTSIDE
 * `TerminalSwapReviewFlow` (e.g. the ticket's parent) will throw a missing-context error.
 */
export function useTerminalReviewTrigger(): { onReview: () => void } {
  return { onReview: useOnReviewPress().handleOnReviewPress }
}
