import { type ReactNode, useEffect, useMemo, useState } from 'react'
import type { AuthTrigger } from 'uniswap/src/features/auth/types'
import type { TransactionScreen } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { useParsedSwapWarnings } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings/useSwapWarnings'
import { useCreateSwapReviewCallbacks } from 'uniswap/src/features/transactions/swap/review/hooks/useCreateSwapReviewCallbacks'
import { createSwapReviewCallbacksStore } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewCallbacksStore/createSwapReviewCallbacksStore'
import { SwapReviewCallbacksStoreContext } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewCallbacksStore/SwapReviewCallbacksStoreContext'
import { useSwapReviewActions } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewStore/useSwapReviewStore'
import {
  useSwapReviewWarningStateActions,
  useSwapReviewWarningStore,
} from 'uniswap/src/features/transactions/swap/review/stores/swapReviewWarningStore/useSwapReviewWarningStore'
import type { GetExecuteSwapService } from 'uniswap/src/features/transactions/swap/services/executeSwapService'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { useHasValueChanged } from 'utilities/src/react/useHasValueChanged'

interface SwapReviewCallbacksContextProviderProps {
  children: ReactNode
  setScreen: (screen: TransactionScreen) => void
  authTrigger?: AuthTrigger
  onSubmitSwap?: () => Promise<void> | void
  onClose: () => void
  onAcceptTrade: () => void
  getExecuteSwapService: GetExecuteSwapService
}

export const SwapReviewCallbacksContextProvider = ({
  children,
  setScreen,
  authTrigger,
  onSubmitSwap,
  onClose,
  onAcceptTrade,
  getExecuteSwapService,
}: SwapReviewCallbacksContextProviderProps): JSX.Element => {
  const { setShowWarningModal, setWarningAcknowledged, setShouldSubmitTx } = useSwapReviewWarningStateActions()

  const { showWarningModal, warningAcknowledged, shouldSubmitTx } = useSwapReviewWarningStore((s) => ({
    showWarningModal: s.showWarningModal,
    warningAcknowledged: s.warningAcknowledged,
    shouldSubmitTx: s.shouldSubmitTx,
  }))

  const { setCurrentStep, setSteps, resetCurrentStep, setSubmissionError, setRetrySwap } = useSwapReviewActions()
  const updateSwapForm = useSwapFormStore((s) => s.updateSwapForm)
  const { reviewScreenWarning } = useParsedSwapWarnings()

  const { onSwapButtonClick, onConfirmWarning, onCancelWarning, onShowWarning, onCloseWarning } =
    useCreateSwapReviewCallbacks({
      resetCurrentStep,
      setSubmissionError,
      setRetrySwap,
      showWarningModal,
      warningAcknowledged,
      shouldSubmitTx,
      setShowWarningModal,
      setWarningAcknowledged,
      setShouldSubmitTx,
      setScreen,
      authTrigger,
      onSubmitSwap,
      onClose,
      getExecuteSwapService,
      updateSwapForm,
      reviewScreenWarning,
      setCurrentStep,
      setSteps,
    })

  const derivedState = useMemo(
    () => ({
      onSwapButtonClick,
      onConfirmWarning,
      onCancelWarning,
      onShowWarning,
      onCloseWarning,
      onAcceptTrade,
    }),
    [onSwapButtonClick, onConfirmWarning, onCancelWarning, onShowWarning, onCloseWarning, onAcceptTrade],
  )

  const [store] = useState(() => createSwapReviewCallbacksStore(derivedState))

  const hasDerivedStateChanged = useHasValueChanged(derivedState)

  useEffect(() => {
    if (hasDerivedStateChanged) {
      store.setState(derivedState)
    }
  }, [derivedState, store, hasDerivedStateChanged])

  return <SwapReviewCallbacksStoreContext.Provider value={store}>{children}</SwapReviewCallbacksStoreContext.Provider>
}
