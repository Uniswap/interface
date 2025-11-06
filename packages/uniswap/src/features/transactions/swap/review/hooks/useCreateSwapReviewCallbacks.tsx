import { TradingApi } from '@universe/api'
import { useCallback, useMemo } from 'react'
// biome-ignore lint/style/noRestrictedImports: only using to keep a consistent timing on interface
import { ADAPTIVE_MODAL_ANIMATION_DURATION } from 'ui/src/components/modal/AdaptiveWebModal'
import type { ParsedWarnings } from 'uniswap/src/components/modals/WarningModal/types'
import type { AuthTrigger } from 'uniswap/src/features/auth/types'
import { TransactionScreen } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import type { TransactionStep } from 'uniswap/src/features/transactions/steps/types'
import { shouldShowFlashblocksUI } from 'uniswap/src/features/transactions/swap/components/UnichainInstantBalanceModal/utils'
import { useIsUnichainFlashblocksEnabled } from 'uniswap/src/features/transactions/swap/hooks/useIsUnichainFlashblocksEnabled'
import type { GetExecuteSwapService } from 'uniswap/src/features/transactions/swap/services/executeSwapService'
import { useSwapDependenciesStore } from 'uniswap/src/features/transactions/swap/stores/swapDependenciesStore/useSwapDependenciesStore'
import type { SwapFormState } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/types'
import { useSwapTxStore } from 'uniswap/src/features/transactions/swap/stores/swapTxStore/useSwapTxStore'
import type { SetCurrentStepFn } from 'uniswap/src/features/transactions/swap/types/swapCallback'
import { createTransactionId } from 'uniswap/src/utils/createTransactionId'
import { isWebApp } from 'utilities/src/platform'
import { useEvent } from 'utilities/src/react/hooks'

interface SwapReviewCallbacks {
  onSwapButtonClick: () => Promise<void>
  onConfirmWarning: () => void
  onCancelWarning: () => void
  onShowWarning: () => void
  onCloseWarning: () => void
}

export function useCreateSwapReviewCallbacks(ctx: {
  resetCurrentStep: () => void
  setScreen: (screen: TransactionScreen) => void
  authTrigger?: AuthTrigger
  onSubmitSwap?: () => Promise<void> | void
  setSubmissionError: (error?: Error) => void
  setRetrySwap: (onPressRetry?: () => void) => void
  onClose: () => void
  showWarningModal: boolean
  warningAcknowledged: boolean
  shouldSubmitTx: boolean
  setShowWarningModal: (show: boolean) => void
  setWarningAcknowledged: (acknowledged: boolean) => void
  setShouldSubmitTx: (shouldSubmit: boolean) => void
  getExecuteSwapService: GetExecuteSwapService
  updateSwapForm: (newState: Partial<SwapFormState>) => void
  reviewScreenWarning: ParsedWarnings['reviewScreenWarning']
  setCurrentStep: SetCurrentStepFn
  setSteps: (steps: TransactionStep[]) => void
}): SwapReviewCallbacks {
  const {
    resetCurrentStep,
    setScreen,
    authTrigger,
    onSubmitSwap,
    setSubmissionError,
    setRetrySwap,
    onClose,
    showWarningModal,
    warningAcknowledged,
    shouldSubmitTx,
    setShowWarningModal,
    setWarningAcknowledged,
    setShouldSubmitTx,
    getExecuteSwapService,
    updateSwapForm,
    reviewScreenWarning,
    setCurrentStep,
    setSteps,
  } = ctx

  const { derivedSwapInfo } = useSwapDependenciesStore((s) => ({
    derivedSwapInfo: s.derivedSwapInfo,
    getExecuteSwapService: s.getExecuteSwapService,
  }))
  const chainId = derivedSwapInfo.chainId
  const isFlashblocksEnabled = useIsUnichainFlashblocksEnabled(chainId)

  const shouldShowConfirmedState =
    shouldShowFlashblocksUI(derivedSwapInfo.trade.trade?.routing) ||
    // show the confirmed state for bridges
    derivedSwapInfo.trade.trade?.routing === TradingApi.Routing.BRIDGE

  const onFailure = useCallback(
    (error?: Error, onPressRetry?: () => void) => {
      resetCurrentStep()

      // Create a new txId for the next transaction, as the existing one may be used in state to track the failed submission.
      const newTxId = createTransactionId()
      updateSwapForm({ isSubmitting: false, isConfirmed: false, txId: newTxId, showPendingUI: false })

      setSubmissionError(error)
      setRetrySwap(() => onPressRetry)
    },
    [updateSwapForm, setSubmissionError, resetCurrentStep, setRetrySwap],
  )

  const onSuccess = useCallback(() => {
    // For Unichain networks, trigger confirmation and branch to stall+fetch logic (ie handle in component)
    if (isFlashblocksEnabled && shouldShowConfirmedState) {
      resetCurrentStep()
      updateSwapForm({
        isConfirmed: true,
        isSubmitting: false,
        showPendingUI: false,
      })
      return
    }

    // On interface, the swap component stays mounted; after swap we reset the form to avoid showing the previous values.
    if (isWebApp) {
      updateSwapForm({
        exactAmountFiat: undefined,
        exactAmountToken: '',
        showPendingUI: false,
        isConfirmed: false,
        instantReceiptFetchTime: undefined,
        instantOutputAmountRaw: undefined,
        txHash: undefined,
        txHashReceivedTime: undefined,
      })
      setTimeout(
        () =>
          updateSwapForm({
            isSubmitting: false,
          }),
        ADAPTIVE_MODAL_ANIMATION_DURATION,
      )
      setScreen(TransactionScreen.Form)
    }
    onClose()
  }, [setScreen, updateSwapForm, onClose, isFlashblocksEnabled, shouldShowConfirmedState, resetCurrentStep])

  const onPending = useCallback(() => {
    // Skip pending UI only for Unichain networks with flashblocks-compatible routes
    if (isFlashblocksEnabled && shouldShowConfirmedState) {
      return
    }
    updateSwapForm({ showPendingUI: true })
  }, [updateSwapForm, isFlashblocksEnabled, shouldShowConfirmedState])

  const swapTxContext = useSwapTxStore((s) => s)

  const getSwapTxContext = useEvent(() => swapTxContext)

  const executeSwapService = useMemo(
    () =>
      getExecuteSwapService({
        onSuccess,
        onFailure,
        onPending,
        setCurrentStep,
        setSteps,
        getSwapTxContext,
      }),
    [getExecuteSwapService, onSuccess, onFailure, onPending, setCurrentStep, setSteps, getSwapTxContext],
  )

  const submitTransaction = useCallback(() => {
    if (reviewScreenWarning && !showWarningModal && !warningAcknowledged) {
      setShouldSubmitTx(true)
      setShowWarningModal(true)
      return
    }

    executeSwapService.executeSwap()
  }, [
    reviewScreenWarning,
    showWarningModal,
    warningAcknowledged,
    setShouldSubmitTx,
    setShowWarningModal,
    executeSwapService,
  ])

  const onSwapButtonClick = useCallback(async () => {
    updateSwapForm({ isSubmitting: true })

    if (authTrigger) {
      await authTrigger({
        successCallback: submitTransaction,
        failureCallback: onFailure,
      })
    } else {
      submitTransaction()
    }
    await onSubmitSwap?.()
  }, [authTrigger, onFailure, submitTransaction, updateSwapForm, onSubmitSwap])

  const onConfirmWarning = useCallback(() => {
    setWarningAcknowledged(true)
    setShowWarningModal(false)

    if (shouldSubmitTx) {
      executeSwapService.executeSwap()
    }
  }, [shouldSubmitTx, executeSwapService, setShowWarningModal, setWarningAcknowledged])

  const onCancelWarning = useCallback(() => {
    if (shouldSubmitTx) {
      onFailure()
    }

    setShowWarningModal(false)
    setWarningAcknowledged(false)
    setShouldSubmitTx(false)
  }, [onFailure, shouldSubmitTx, setShowWarningModal, setWarningAcknowledged, setShouldSubmitTx])

  const onShowWarning = useCallback(() => {
    setShowWarningModal(true)
  }, [setShowWarningModal])

  const onCloseWarning = useCallback(() => {
    setShowWarningModal(false)
  }, [setShowWarningModal])

  return {
    onSwapButtonClick,
    onConfirmWarning,
    onCancelWarning,
    onShowWarning,
    onCloseWarning,
  }
}
