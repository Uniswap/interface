import { SwapEventName, SwapPriceUpdateUserResponse } from '@uniswap/analytics-events'
import { Currency, Percent } from '@uniswap/sdk-core'
import SwapError, { PendingModalError } from 'components/ConfirmSwapModal/Error'
import { SwapHead } from 'components/ConfirmSwapModal/Head'
import { SwapModal } from 'components/ConfirmSwapModal/Modal'
import { Pending } from 'components/ConfirmSwapModal/Pending'
import SwapProgressIndicator from 'components/ConfirmSwapModal/ProgressIndicator'
import { PopupType } from 'components/Popups/types'
import { AutoColumn } from 'components/deprecated/Column'
import { SwapDetails } from 'components/swap/SwapDetails'
import { SwapPreview } from 'components/swap/SwapPreview'
import { useConfirmModalState } from 'hooks/useConfirmModalState'
import { Allowance, AllowanceState } from 'hooks/usePermit2Allowance'
import { SwapResult, useSwapTransactionStatus } from 'hooks/useSwapCallback'
import styled from 'lib/styled-components'
import { useCallback, useEffect, useMemo } from 'react'
import { useSuppressPopups } from 'state/application/hooks'
import { InterfaceTrade } from 'state/routing/types'
import { isLimitTrade, isPreviewTrade, isUniswapXTradeType } from 'state/routing/utils'
import { useOrder } from 'state/signatures/hooks'
import { ThemeProvider } from 'theme'
import { FadePresence } from 'theme/components/FadePresence'
import { UniswapXOrderStatus } from 'types/uniswapx'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { ADAPTIVE_MODAL_ANIMATION_DURATION } from 'ui/src/components/modal/AdaptiveWebModal'
import { TransactionStatus } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { CurrencyField } from 'uniswap/src/types/currency'
import { SignatureExpiredError, UniswapXv2HardQuoteError } from 'utils/errors'
import { formatSwapPriceUpdatedEventProperties } from 'utils/loggingFormatters'
import { didUserReject } from 'utils/swapErrorToUserReadableMessage'

const Container = styled.div<{ $height?: string; $padding?: string }>`
  height: ${({ $height }) => $height ?? ''};
  padding: ${({ $padding }) => $padding ?? ''};
`

export enum ConfirmModalState {
  REVIEWING = 0,
  WRAPPING = 1,
  RESETTING_TOKEN_ALLOWANCE = 2,
  APPROVING_TOKEN = 3,
  PERMITTING = 4,
  PENDING_CONFIRMATION = 5,
}

export function ConfirmSwapModal({
  trade,
  originalTrade,
  inputCurrency,
  allowance,
  allowedSlippage,
  fiatValueInput,
  fiatValueOutput,
  swapResult,
  swapError,
  priceImpact,
  clearSwapState,
  onAcceptChanges,
  onConfirm,
  onCurrencySelection,
  onDismiss,
  onXV2RetryWithClassic,
}: {
  trade: InterfaceTrade
  originalTrade?: InterfaceTrade
  inputCurrency?: Currency
  allowance: Allowance
  allowedSlippage: Percent
  fiatValueInput: { data?: number; isLoading: boolean }
  fiatValueOutput: { data?: number; isLoading: boolean }
  swapResult?: SwapResult
  swapError?: Error
  priceImpact?: Percent
  clearSwapState: () => void
  onAcceptChanges?: () => void
  onConfirm: () => void
  onCurrencySelection: (field: CurrencyField, currency: Currency, isResettingWETHAfterWrap?: boolean) => void
  onDismiss: () => void
  onXV2RetryWithClassic?: () => void
}) {
  const {
    confirmModalState,
    pendingModalSteps,
    priceUpdate,
    doesTradeDiffer,
    approvalError,
    wrapTxHash,
    startSwapFlow,
    onCancel,
    resetToReviewScreen,
  } = useConfirmModalState({
    trade,
    originalTrade,
    allowance,
    allowedSlippage,
    onCurrencySelection,
    onSwap: () => {
      clearSwapState()
      onConfirm()
    },
  })

  // Get status depending on swap type
  const swapStatus = useSwapTransactionStatus(swapResult)
  const uniswapXOrder = useOrder(isUniswapXTradeType(swapResult?.type) ? swapResult.response.orderHash : '')

  // Has the transaction been confirmed onchain?
  const swapConfirmed =
    swapStatus === TransactionStatus.Confirmed || uniswapXOrder?.status === UniswapXOrderStatus.FILLED

  // Has a limit order been submitted?
  const limitPlaced = isLimitTrade(trade) && uniswapXOrder?.status === UniswapXOrderStatus.OPEN

  // Has the transaction failed locally (i.e. before network or submission), or has it been reverted onchain?
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

  // Determine which view to show based on confirm modal state and other conditions
  const { showPreview, showDetails, showProgressIndicator, showAcceptChanges, showConfirming, showSuccess, showError } =
    useMemo(() => {
      const showAcceptChanges = confirmModalState !== ConfirmModalState.PENDING_CONFIRMATION && doesTradeDiffer
      let showPreview, showDetails, showProgressIndicator, showConfirming, showSuccess, showError
      if (errorType) {
        // When any type of error is encountered (except for SignatureExpiredError, which has special retry logic)
        showError = true
      } else if (swapConfirmed || limitPlaced) {
        showSuccess = true
      } else if (confirmModalState === ConfirmModalState.REVIEWING || showAcceptChanges) {
        // When swap is in review, either initially or to accept changes, show the swap details
        showPreview = true
        showDetails = true
      } else if (pendingModalSteps.length > 1) {
        // When a multi-step swap is in progress (i.e. not in review and not yet confirmed), show the progress indicator
        showPreview = true
        showProgressIndicator = true
      } else {
        // When a single-step swap requires confirmation, show a loading spinner (possibly followed by a submission icon)
        showConfirming = true
      }
      return {
        showPreview,
        showDetails,
        showProgressIndicator,
        showAcceptChanges,
        showConfirming,
        showSuccess,
        showError,
      }
    }, [confirmModalState, doesTradeDiffer, errorType, limitPlaced, pendingModalSteps.length, swapConfirmed])

  // Reset modal state if user rejects the swap
  useEffect(() => {
    if (swapError && !swapFailed) {
      onCancel()
    }
  }, [onCancel, swapError, swapFailed])

  const { suppressPopups, unsuppressPopups } = useSuppressPopups([PopupType.Transaction, PopupType.Order])

  const onModalDismiss = useCallback(() => {
    if (trade && doesTradeDiffer && confirmModalState !== ConfirmModalState.PENDING_CONFIRMATION) {
      // If the user dismissed the modal while showing the price update, log the event as rejected.
      sendAnalyticsEvent(
        SwapEventName.SWAP_PRICE_UPDATE_ACKNOWLEDGED,
        formatSwapPriceUpdatedEventProperties(trade, priceUpdate, SwapPriceUpdateUserResponse.REJECTED),
      )
    }
    onDismiss()
    setTimeout(() => {
      // Reset local state after the modal dismiss animation finishes, to avoid UI flicker as it dismisses
      onCancel()
    }, ADAPTIVE_MODAL_ANIMATION_DURATION)
    // Popups are suppressed when modal is open; re-enable them on dismissal
    unsuppressPopups()
  }, [confirmModalState, doesTradeDiffer, onCancel, onDismiss, priceUpdate, unsuppressPopups, trade])

  return (
    // Wrapping in a new theme provider resets any color extraction overriding on the current page. Swap modal should use default/non-overridden theme.
    <ThemeProvider>
      <SwapModal onDismiss={onModalDismiss}>
        {/* Head section displays title, help button, close icon */}
        <Container $height="24px" $padding="6px 12px 4px 12px">
          <SwapHead
            onDismiss={onModalDismiss}
            isLimitTrade={isLimitTrade(trade)}
            confirmModalState={confirmModalState}
          />
        </Container>
        {/* Preview section displays input / output currency amounts */}
        {showPreview && (
          <Container $padding="12px 12px 0px 12px">
            <SwapPreview inputCurrency={inputCurrency} trade={trade} allowedSlippage={allowedSlippage} />
          </Container>
        )}
        {/* Details section displays rate, fees, network cost, etc. w/ additional details in drop-down menu .*/}
        {showDetails && (
          <Container>
            <FadePresence>
              <AutoColumn gap="md">
                <SwapDetails
                  onConfirm={() => {
                    suppressPopups()
                    startSwapFlow()
                  }}
                  inputCurrency={inputCurrency}
                  trade={trade}
                  allowance={allowance}
                  swapResult={swapResult}
                  allowedSlippage={allowedSlippage}
                  isLoading={isPreviewTrade(trade)}
                  disabledConfirm={
                    showAcceptChanges || isPreviewTrade(trade) || allowance.state === AllowanceState.LOADING
                  }
                  fiatValueInput={fiatValueInput}
                  fiatValueOutput={fiatValueOutput}
                  showAcceptChanges={Boolean(showAcceptChanges)}
                  onAcceptChanges={onAcceptChanges}
                  swapErrorMessage={swapFailed ? swapError?.message : undefined}
                  priceImpact={priceImpact}
                />
              </AutoColumn>
            </FadePresence>
          </Container>
        )}
        {/* Progress indicator displays all the steps of the swap flow and their current status  */}
        {confirmModalState !== ConfirmModalState.REVIEWING && showProgressIndicator && (
          <Container>
            <FadePresence>
              <SwapProgressIndicator
                steps={pendingModalSteps}
                currentStep={confirmModalState}
                trade={trade}
                swapResult={swapResult}
                wrapTxHash={wrapTxHash}
                tokenApprovalPending={allowance.state === AllowanceState.REQUIRED && allowance.isApprovalPending}
                revocationPending={allowance.state === AllowanceState.REQUIRED && allowance.isRevocationPending}
                swapError={swapError}
                onRetryUniswapXSignature={onConfirm}
              />
            </FadePresence>
          </Container>
        )}
        {/* Pending screen displays spinner for single-step confirmations, as well as success screen for all flows */}
        {(showConfirming || showSuccess) && (
          <Container>
            <FadePresence>
              <Pending
                trade={trade}
                swapResult={swapResult}
                wrapTxHash={wrapTxHash}
                tokenApprovalPending={allowance.state === AllowanceState.REQUIRED && allowance.isApprovalPending}
                revocationPending={allowance.state === AllowanceState.REQUIRED && allowance.isRevocationPending}
              />
            </FadePresence>
          </Container>
        )}
        {/* Error screen handles all error types with custom messaging and retry logic */}
        {errorType && showError && (
          <Container $padding="16px">
            <SwapError
              trade={trade}
              showTrade={errorType !== PendingModalError.XV2_HARD_QUOTE_ERROR}
              swapResult={swapResult}
              errorType={errorType}
              onRetry={() => {
                if (errorType === PendingModalError.XV2_HARD_QUOTE_ERROR) {
                  onXV2RetryWithClassic?.()
                  resetToReviewScreen()
                } else {
                  startSwapFlow()
                }
              }}
            />
          </Container>
        )}
      </SwapModal>
    </ThemeProvider>
  )
}
