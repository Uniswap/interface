import { Currency } from '@uniswap/sdk-core'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { AnimateTransition, Flex } from 'ui/src'
// oxlint-disable-next-line no-restricted-imports -- ui constant needed for modal animation timing
import { ADAPTIVE_MODAL_ANIMATION_DURATION } from 'ui/src/components/modal/AdaptiveWebModal'
import { TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import { CurrencyField } from 'uniswap/src/types/currency'
import { ZERO_PERCENT } from '~/constants/misc'
import { Allowance, AllowanceState } from '~/hooks/usePermit2Allowance'
import {
  Error as ConfirmLimitOrderErrorPanel,
  PendingModalError,
} from '~/pages/Swap/Limit/ConfirmLimitOrderModal/Error'
import { SwapHead } from '~/pages/Swap/Limit/ConfirmLimitOrderModal/Head'
import { SwapModal } from '~/pages/Swap/Limit/ConfirmLimitOrderModal/Modal'
import { Pending } from '~/pages/Swap/Limit/ConfirmLimitOrderModal/Pending'
import {
  isProgressIndicatorStep,
  type ProgressIndicatorStep,
  ProgressIndicator as LimitOrderProgressIndicator,
} from '~/pages/Swap/Limit/ConfirmLimitOrderModal/ProgressIndicator/ProgressIndicator'
import { ConfirmModalState } from '~/pages/Swap/Limit/ConfirmLimitOrderModal/state'
import { useConfirmModalState } from '~/pages/Swap/Limit/ConfirmLimitOrderModal/useConfirmModalState'
import { LimitOrderDetails } from '~/pages/Swap/Limit/LimitOrderDetails'
import { LimitOrderPreview } from '~/pages/Swap/Limit/LimitOrderPreview'
import { useSuppressPopups } from '~/state/application/hooks'
import { PopupType } from '~/state/popups/types'
import { InterfaceTrade } from '~/state/routing/types'
import { isLimitTrade, isPreviewTrade, isUniswapXTradeType } from '~/state/routing/utils'
import { useUniswapXOrderByOrderHash } from '~/state/transactions/hooks'
import { ThemeProvider } from '~/theme'
import type { LimitOrderResult } from '~/types/trade'
import { SignatureExpiredError, UniswapXv2HardQuoteError } from '~/utils/errors'
import { didUserReject } from '~/utils/swapErrorToUserReadableMessage'

/** Must match `animation` on `AnimateTransition` below so held error UI clears after exit completes. */
const CONFIRM_LIMIT_ORDER_MODAL_BODY_TRANSITION_MS = 200

/**
 * Single source of truth for `AnimateTransition` child order.
 * Active panel is chosen below; content for each id lives in `ConfirmLimitOrderModalBodyPanel`.
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
  limitOrderResult?: LimitOrderResult
  limitOrderError?: Error
  orderFlowFailed: boolean
  suppressPopups: () => void
  startSwapFlow: () => void
  pendingModalSteps: ProgressIndicatorStep[]
  confirmModalState: ConfirmModalState
  wrapTxHash?: string
  onConfirm: () => void
  displayedModalErrorType: PendingModalError | undefined
  resetToReviewScreen: () => void
}

function ConfirmLimitOrderModalBodyPanel({
  panelId,
  trade,
  inputCurrency,
  allowance,
  fiatValueInput,
  fiatValueOutput,
  limitOrderResult,
  limitOrderError,
  orderFlowFailed,
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
            <LimitOrderPreview inputCurrency={inputCurrency} trade={trade} allowedSlippage={ZERO_PERCENT} />
          </Flex>
          <Flex>
            <Flex gap="$spacing12">
              <LimitOrderDetails
                onConfirm={() => {
                  suppressPopups()
                  startSwapFlow()
                }}
                inputCurrency={inputCurrency}
                trade={trade}
                allowance={allowance}
                limitOrderResult={limitOrderResult}
                allowedSlippage={ZERO_PERCENT}
                isLoading={isPreviewTrade(trade)}
                disabledConfirm={isPreviewTrade(trade) || allowance.state === AllowanceState.LOADING}
                fiatValueInput={fiatValueInput}
                fiatValueOutput={fiatValueOutput}
                showAcceptChanges={false}
                limitOrderErrorMessage={orderFlowFailed ? limitOrderError?.message : undefined}
              />
            </Flex>
          </Flex>
        </Flex>
      )
    case 'progress':
      return (
        <Flex>
          <Flex p="$padding12" pb="$none">
            <LimitOrderPreview inputCurrency={inputCurrency} trade={trade} allowedSlippage={ZERO_PERCENT} />
          </Flex>
          <Flex>
            <LimitOrderProgressIndicator
              steps={pendingModalSteps}
              currentStep={
                isProgressIndicatorStep(confirmModalState)
                  ? confirmModalState
                  : (pendingModalSteps[0] ?? ConfirmModalState.WRAPPING)
              }
              trade={trade}
              limitOrderResult={limitOrderResult}
              wrapTxHash={wrapTxHash}
              tokenApprovalPending={allowance.state === AllowanceState.REQUIRED && allowance.isApprovalPending}
              revocationPending={allowance.state === AllowanceState.REQUIRED && allowance.isRevocationPending}
              limitOrderError={limitOrderError}
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
            limitOrderResult={limitOrderResult}
            wrapTxHash={wrapTxHash}
            tokenApprovalPending={allowance.state === AllowanceState.REQUIRED && allowance.isApprovalPending}
            revocationPending={allowance.state === AllowanceState.REQUIRED && allowance.isRevocationPending}
          />
        </Flex>
      )
    case 'error':
      return (
        <Flex padding="$spacing16">
          <ConfirmLimitOrderErrorPanel
            trade={trade}
            showTrade={
              displayedModalErrorType !== undefined &&
              displayedModalErrorType !== PendingModalError.XV2_HARD_QUOTE_ERROR
            }
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
      throw new Error(`Unexpected confirm limit order modal panel: ${String(_exhaustive)}`)
    }
  }
}

/** Limit-order confirmation modal (wrap, allowance, permit, signature, pending / success). */
export function ConfirmLimitOrderModal({
  trade,
  inputCurrency,
  allowance,
  fiatValueInput,
  fiatValueOutput,
  limitOrderResult,
  limitOrderError,
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
  limitOrderResult?: LimitOrderResult
  limitOrderError?: Error
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
    onSubmit: () => {
      clearSwapState()
      onConfirm()
    },
  })

  const uniswapXOrder = useUniswapXOrderByOrderHash(
    isUniswapXTradeType(limitOrderResult?.type) ? limitOrderResult.response.orderHash : '',
  )

  const swapConfirmed = uniswapXOrder?.status === TransactionStatus.Success
  const limitPlaced = isLimitTrade(trade) && uniswapXOrder?.status === TransactionStatus.Pending

  const orderFlowFailed = Boolean(limitOrderError) && !didUserReject(limitOrderError)
  const errorType = useMemo(() => {
    if (approvalError) {
      return approvalError
    }
    if (limitOrderError instanceof SignatureExpiredError) {
      return undefined
    }
    if (limitOrderError instanceof UniswapXv2HardQuoteError) {
      return PendingModalError.XV2_HARD_QUOTE_ERROR
    }
    if (limitOrderError && !didUserReject(limitOrderError)) {
      return PendingModalError.CONFIRMATION_ERROR
    }
    return undefined
  }, [approvalError, limitOrderError])

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
      }, CONFIRM_LIMIT_ORDER_MODAL_BODY_TRANSITION_MS)
      return () => clearTimeout(clearHeldErrorTimer)
    }
    return undefined
  }, [modalBodyPanelId, errorType])

  // Reset modal state if user rejects the limit order flow
  useEffect(() => {
    if (limitOrderError && !orderFlowFailed) {
      onCancel()
    }
  }, [onCancel, limitOrderError, orderFlowFailed])

  const { suppressPopups, unsuppressPopups } = useSuppressPopups([PopupType.Transaction, PopupType.Order])

  const onModalDismiss = useCallback(() => {
    onDismiss()
    setTimeout(() => {
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
    limitOrderResult,
    limitOrderError,
    orderFlowFailed,
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
    <ThemeProvider>
      <SwapModal onDismiss={onModalDismiss}>
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
          animation={`${CONFIRM_LIMIT_ORDER_MODAL_BODY_TRANSITION_MS}ms`}
        >
          {MODAL_BODY_PANEL_ORDER.map((panelId) => (
            <ConfirmLimitOrderModalBodyPanel key={panelId} panelId={panelId} {...bodyPanelProps} />
          ))}
        </AnimateTransition>
      </SwapModal>
    </ThemeProvider>
  )
}
