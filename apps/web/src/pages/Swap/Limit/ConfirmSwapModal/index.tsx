import { Currency } from '@uniswap/sdk-core'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { AnimateTransition, Flex } from 'ui/src'
// oxlint-disable-next-line no-restricted-imports -- ui constant needed for modal animation timing
import { ADAPTIVE_MODAL_ANIMATION_DURATION } from 'ui/src/components/modal/AdaptiveWebModal'
import { TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import { CurrencyField } from 'uniswap/src/types/currency'
import { ZERO_PERCENT } from '~/constants/misc'
import { SwapDetails } from '~/features/Swap/SwapDetails'
import { SwapPreview } from '~/features/Swap/SwapPreview'
import { Allowance, AllowanceState } from '~/hooks/usePermit2Allowance'
import { SwapResult, useSwapTransactionStatus } from '~/hooks/useSwapCallback'
import { Error as SwapError, PendingModalError } from '~/pages/Swap/Limit/ConfirmSwapModal/Error'
import { SwapHead } from '~/pages/Swap/Limit/ConfirmSwapModal/Head'
import { SwapModal } from '~/pages/Swap/Limit/ConfirmSwapModal/Modal'
import { Pending } from '~/pages/Swap/Limit/ConfirmSwapModal/Pending'
import {
  isProgressIndicatorStep,
  type ProgressIndicatorStep,
  ProgressIndicator as SwapProgressIndicator,
} from '~/pages/Swap/Limit/ConfirmSwapModal/ProgressIndicator/ProgressIndicator'
import { ConfirmModalState } from '~/pages/Swap/Limit/ConfirmSwapModal/state'
import { useConfirmModalState } from '~/pages/Swap/Limit/ConfirmSwapModal/useConfirmModalState'
import { useSuppressPopups } from '~/state/application/hooks'
import { PopupType } from '~/state/popups/types'
import { InterfaceTrade } from '~/state/routing/types'
import { isLimitTrade, isPreviewTrade, isUniswapXTradeType } from '~/state/routing/utils'
import { useUniswapXOrderByOrderHash } from '~/state/transactions/hooks'
import { ThemeProvider } from '~/theme'
import { SignatureExpiredError, UniswapXv2HardQuoteError } from '~/utils/errors'
import { didUserReject } from '~/utils/swapErrorToUserReadableMessage'

/** Must match `animation` on `AnimateTransition` below so held error UI clears after exit completes. */
const CONFIRM_SWAP_MODAL_BODY_TRANSITION_MS = 200

/**
 * Single source of truth for `AnimateTransition` child order.
 * `activePanelId` is chosen below; content for each id lives in `ConfirmSwapModalBodyPanel` switch.
 */
const MODAL_BODY_PANEL_ORDER = ['review', 'progress', 'pending', 'error'] as const
type ConfirmModalBodyPanelId = (typeof MODAL_BODY_PANEL_ORDER)[number]

type ConfirmModalBodyPanelProps = {
  panelId: ConfirmModalBodyPanelId
  trade: InterfaceTrade
  inputCurrency?: Currency
  allowance: Allowance
  fiatValueInput: { data?: number; isLoading: boolean }
  fiatValueOutput: { data?: number; isLoading: boolean }
  swapResult?: SwapResult
  swapError?: Error
  swapFailed: boolean
  suppressPopups: () => void
  startSwapFlow: () => void
  pendingModalSteps: ProgressIndicatorStep[]
  confirmModalState: ConfirmModalState
  wrapTxHash?: string
  onConfirm: () => void
  displayedModalErrorType: PendingModalError | undefined
  resetToReviewScreen: () => void
}

function ConfirmSwapModalBodyPanel({
  panelId,
  trade,
  inputCurrency,
  allowance,
  fiatValueInput,
  fiatValueOutput,
  swapResult,
  swapError,
  swapFailed,
  suppressPopups,
  startSwapFlow,
  pendingModalSteps,
  confirmModalState,
  wrapTxHash,
  onConfirm,
  displayedModalErrorType,
  resetToReviewScreen,
}: ConfirmModalBodyPanelProps): JSX.Element {
  switch (panelId) {
    case 'review':
      return (
        <Flex>
          <Flex p="$padding12" pb="$none">
            <SwapPreview inputCurrency={inputCurrency} trade={trade} allowedSlippage={ZERO_PERCENT} />
          </Flex>
          <Flex>
            <Flex gap="$spacing12">
              <SwapDetails
                onConfirm={() => {
                  suppressPopups()
                  startSwapFlow()
                }}
                inputCurrency={inputCurrency}
                trade={trade}
                allowance={allowance}
                swapResult={swapResult}
                allowedSlippage={ZERO_PERCENT}
                isLoading={isPreviewTrade(trade)}
                disabledConfirm={isPreviewTrade(trade) || allowance.state === AllowanceState.LOADING}
                fiatValueInput={fiatValueInput}
                fiatValueOutput={fiatValueOutput}
                showAcceptChanges={false}
                swapErrorMessage={swapFailed ? swapError?.message : undefined}
              />
            </Flex>
          </Flex>
        </Flex>
      )
    case 'progress':
      return (
        <Flex>
          <Flex p="$padding12" pb="$none">
            <SwapPreview inputCurrency={inputCurrency} trade={trade} allowedSlippage={ZERO_PERCENT} />
          </Flex>
          <Flex>
            <SwapProgressIndicator
              steps={pendingModalSteps}
              currentStep={
                isProgressIndicatorStep(confirmModalState)
                  ? confirmModalState
                  : (pendingModalSteps[0] ?? ConfirmModalState.WRAPPING)
              }
              trade={trade}
              swapResult={swapResult}
              wrapTxHash={wrapTxHash}
              tokenApprovalPending={allowance.state === AllowanceState.REQUIRED && allowance.isApprovalPending}
              revocationPending={allowance.state === AllowanceState.REQUIRED && allowance.isRevocationPending}
              swapError={swapError}
              onRetryUniswapXSignature={onConfirm}
            />
          </Flex>
        </Flex>
      )
    case 'pending':
      return (
        <Flex>
          <Pending
            trade={trade}
            swapResult={swapResult}
            wrapTxHash={wrapTxHash}
            tokenApprovalPending={allowance.state === AllowanceState.REQUIRED && allowance.isApprovalPending}
            revocationPending={allowance.state === AllowanceState.REQUIRED && allowance.isRevocationPending}
          />
        </Flex>
      )
    case 'error':
      return (
        <Flex padding="$spacing16">
          <SwapError
            trade={trade}
            showTrade={
              displayedModalErrorType !== undefined &&
              displayedModalErrorType !== PendingModalError.XV2_HARD_QUOTE_ERROR
            }
            swapResult={swapResult}
            errorType={displayedModalErrorType}
            onRetry={() => {
              const typeForRetry = displayedModalErrorType
              if (typeForRetry === PendingModalError.XV2_HARD_QUOTE_ERROR) {
                resetToReviewScreen()
              } else {
                startSwapFlow()
              }
            }}
          />
        </Flex>
      )
    default: {
      const _exhaustive: never = panelId
      throw new Error(`Unexpected confirm modal panel: ${String(_exhaustive)}`)
    }
  }
}

/** Limit-order confirmation modal (wrap, allowance, permit, signature, pending / success). */
export function ConfirmSwapModal({
  trade,
  inputCurrency,
  allowance,
  fiatValueInput,
  fiatValueOutput,
  swapResult,
  swapError,
  clearSwapState,
  onConfirm,
  onCurrencySelection,
  onDismiss,
}: {
  trade: InterfaceTrade
  inputCurrency?: Currency
  allowance: Allowance
  fiatValueInput: { data?: number; isLoading: boolean }
  fiatValueOutput: { data?: number; isLoading: boolean }
  swapResult?: SwapResult
  swapError?: Error
  clearSwapState: () => void
  onConfirm: () => void
  // oxlint-disable-next-line max-params -- biome-parity: oxlint is stricter here
  onCurrencySelection: (field: CurrencyField, currency: Currency, isResettingWETHAfterWrap?: boolean) => void
  onDismiss: () => void
}) {
  const {
    confirmModalState,
    pendingModalSteps,
    approvalError,
    wrapTxHash,
    startSwapFlow,
    onCancel,
    resetToReviewScreen,
  } = useConfirmModalState({
    trade,
    allowance,
    onCurrencySelection,
    onSwap: () => {
      clearSwapState()
      onConfirm()
    },
  })

  // Get status depending on swap type
  const swapStatus = useSwapTransactionStatus(swapResult)
  const uniswapXOrder = useUniswapXOrderByOrderHash(
    isUniswapXTradeType(swapResult?.type) ? swapResult.response.orderHash : '',
  )

  // Has the transaction been confirmed onchain?
  const swapConfirmed = swapStatus === TransactionStatus.Success || uniswapXOrder?.status === TransactionStatus.Success

  // Has a limit order been submitted?
  const limitPlaced = isLimitTrade(trade) && uniswapXOrder?.status === TransactionStatus.Pending

  // Has the transaction failed locally (i.e. before network or submission), or has it reverted onchain?
  const localSwapFailure = Boolean(swapError) && !didUserReject(swapError)
  const swapReverted = swapStatus === TransactionStatus.Failed
  const swapFailed = localSwapFailure || swapReverted
  const errorType = useMemo(() => {
    if (approvalError) {
      return approvalError
    }
    if (swapError instanceof SignatureExpiredError) {
      return undefined
    }
    if (swapError instanceof UniswapXv2HardQuoteError) {
      return PendingModalError.XV2_HARD_QUOTE_ERROR
    }
    if (swapError && !didUserReject(swapError)) {
      return PendingModalError.CONFIRMATION_ERROR
    }
    return undefined
  }, [approvalError, swapError])

  const lastModalErrorTypeRef = useRef<PendingModalError | undefined>(undefined)

  useLayoutEffect(() => {
    if (errorType !== undefined) {
      lastModalErrorTypeRef.current = errorType
    }
  }, [errorType])

  const displayedModalErrorType = errorType ?? lastModalErrorTypeRef.current

  const modalBodyPanelId = useMemo((): ConfirmModalBodyPanelId => {
    if (errorType) {
      return 'error'
    }
    if (swapConfirmed || limitPlaced) {
      return 'pending'
    }
    if (confirmModalState === ConfirmModalState.REVIEWING) {
      return 'review'
    }
    if (pendingModalSteps.length > 1) {
      return 'progress'
    }
    return 'pending'
  }, [confirmModalState, errorType, limitPlaced, pendingModalSteps.length, swapConfirmed])

  const modalBodyIndex = MODAL_BODY_PANEL_ORDER.indexOf(modalBodyPanelId)

  useEffect(() => {
    if (modalBodyPanelId !== 'error' && errorType === undefined) {
      const clearHeldErrorTimer = setTimeout(() => {
        lastModalErrorTypeRef.current = undefined
      }, CONFIRM_SWAP_MODAL_BODY_TRANSITION_MS)
      return () => clearTimeout(clearHeldErrorTimer)
    }
    return undefined
  }, [modalBodyPanelId, errorType])

  // Reset modal state if user rejects the swap
  useEffect(() => {
    if (swapError && !swapFailed) {
      onCancel()
    }
  }, [onCancel, swapError, swapFailed])

  const { suppressPopups, unsuppressPopups } = useSuppressPopups([PopupType.Transaction, PopupType.Order])

  const onModalDismiss = useCallback(() => {
    onDismiss()
    setTimeout(() => {
      // Reset local state after the modal dismiss animation finishes, to avoid UI flicker as it dismisses
      onCancel()
    }, ADAPTIVE_MODAL_ANIMATION_DURATION)
    unsuppressPopups()
  }, [onCancel, onDismiss, unsuppressPopups])

  const bodyPanelProps: Omit<ConfirmModalBodyPanelProps, 'panelId'> = {
    trade,
    inputCurrency,
    allowance,
    fiatValueInput,
    fiatValueOutput,
    swapResult,
    swapError,
    swapFailed,
    suppressPopups,
    startSwapFlow,
    pendingModalSteps,
    confirmModalState,
    wrapTxHash,
    onConfirm,
    displayedModalErrorType,
    resetToReviewScreen,
  }

  return (
    // Wrapping in a new theme provider resets any color extraction overriding on the current page. Limit confirm modal should use default/non-overridden theme.
    <ThemeProvider>
      <SwapModal onDismiss={onModalDismiss}>
        {/* Head section displays title, help button, close icon */}
        <Flex height={24} p="$padding12" pt="$padding6" pb="$spacing4">
          <SwapHead
            onDismiss={onModalDismiss}
            isLimitTrade={isLimitTrade(trade)}
            confirmModalState={confirmModalState}
          />
        </Flex>
        <AnimateTransition
          currentIndex={modalBodyIndex}
          animationType="fade"
          animation={`${CONFIRM_SWAP_MODAL_BODY_TRANSITION_MS}ms`}
        >
          {MODAL_BODY_PANEL_ORDER.map((panelId) => (
            <ConfirmSwapModalBodyPanel key={panelId} panelId={panelId} {...bodyPanelProps} />
          ))}
        </AnimateTransition>
      </SwapModal>
    </ThemeProvider>
  )
}
