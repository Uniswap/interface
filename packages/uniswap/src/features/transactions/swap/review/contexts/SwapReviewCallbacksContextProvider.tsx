import { ReactNode } from 'react'
import { AuthTrigger } from 'uniswap/src/features/auth/types'
import { TransactionScreen } from 'uniswap/src/features/transactions/TransactionModal/TransactionModalContext'
import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { useParsedSwapWarnings } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings'
import { SwapReviewCallbacksContext } from 'uniswap/src/features/transactions/swap/review/contexts/SwapReviewCallbacksContext'
import { useSwapReviewState } from 'uniswap/src/features/transactions/swap/review/contexts/SwapReviewStateContext'
import { useSwapWarningState } from 'uniswap/src/features/transactions/swap/review/contexts/SwapReviewWarningStateContext'
import { useCreateSwapReviewCallbacks } from 'uniswap/src/features/transactions/swap/review/hooks/useCreateSwapReviewCallbacks'
import { GetExecuteSwapService } from 'uniswap/src/features/transactions/swap/services/executeSwapService'

interface SwapReviewCallbacksContextProviderProps {
  children: ReactNode
  setScreen: (screen: TransactionScreen) => void
  authTrigger?: AuthTrigger
  onSubmitSwap?: () => Promise<void>
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
  const {
    showWarningModal,
    warningAcknowledged,
    shouldSubmitTx,
    setShouldSubmitTx,
    setShowWarningModal,
    setWarningAcknowledged,
  } = useSwapWarningState()
  const { resetCurrentStep, setSubmissionError } = useSwapReviewState()
  const { updateSwapForm } = useSwapFormContext()
  const { reviewScreenWarning } = useParsedSwapWarnings()
  const { setCurrentStep, setSteps } = useSwapReviewState()

  const { onSwapButtonClick, onConfirmWarning, onCancelWarning, onShowWarning, onCloseWarning } =
    useCreateSwapReviewCallbacks({
      resetCurrentStep,
      setSubmissionError,
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
  return (
    <SwapReviewCallbacksContext.Provider
      value={{ onSwapButtonClick, onConfirmWarning, onCancelWarning, onShowWarning, onCloseWarning, onAcceptTrade }}
    >
      {children}
    </SwapReviewCallbacksContext.Provider>
  )
}
