import { Trans } from '@lingui/macro'
import { InterfaceModalName, SwapEventName, SwapPriceUpdateUserResponse } from '@uniswap/analytics-events'
import { Currency, Percent } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { sendAnalyticsEvent, Trace } from 'analytics'
import Badge from 'components/Badge'
import { ChainLogo } from 'components/Logo/ChainLogo'
import Modal, { MODAL_TRANSITION_DURATION } from 'components/Modal'
import { RowFixed } from 'components/Row'
import { getChainInfo } from 'constants/chainInfo'
import { TransactionStatus } from 'graphql/data/__generated__/types-and-hooks'
import { useConfirmModalState } from 'hooks/useConfirmModalState'
import { Allowance, AllowanceState } from 'hooks/usePermit2Allowance'
import { SwapResult } from 'hooks/useSwapCallback'
import { getPriceUpdateBasisPoints } from 'lib/utils/analytics'
import { useCallback, useEffect, useState } from 'react'
import { InterfaceTrade } from 'state/routing/types'
import { isPreviewTrade } from 'state/routing/utils'
import { Field } from 'state/swap/actions'
import { useSwapTransactionStatus } from 'state/transactions/hooks'
import styled from 'styled-components'
import { ThemedText } from 'theme/components'
import { isL2ChainId } from 'utils/chains'
import { SignatureExpiredError } from 'utils/errors'
import { formatSwapPriceUpdatedEventProperties } from 'utils/loggingFormatters'
import { didUserReject } from 'utils/swapErrorToUserReadableMessage'
import { tradeMeaningfullyDiffers } from 'utils/tradeMeaningFullyDiffer'

import { PendingModalContent } from '../swap/PendingModalContent'
import { ErrorModalContent, PendingModalError } from '../swap/PendingModalContent/ErrorModalContent'
import SwapModalFooter from '../swap/SwapModalFooter'
import SwapModalHeader from '../swap/SwapModalHeader'
import { ConfirmationModalContent } from '../TransactionConfirmationModal'

enum ConfirmModalState {
  REVIEWING,
  WRAPPING,
  RESETTING_TOKEN_ALLOWANCE,
  APPROVING_TOKEN,
  PERMITTING,
  PENDING_CONFIRMATION,
}

const StyledL2Badge = styled(Badge)`
  padding: 6px 8px;
`
export default function ConfirmSwapModalV2({
  trade,
  inputCurrency,
  originalTrade,
  onAcceptChanges,
  allowedSlippage,
  allowance,
  clearSwapState,
  onConfirm,
  onDismiss,
  onCurrencySelection,
  swapError,
  swapResult,
  fiatValueInput,
  fiatValueOutput,
}: {
  trade: InterfaceTrade
  inputCurrency?: Currency
  originalTrade?: InterfaceTrade
  swapResult?: SwapResult
  allowedSlippage: Percent
  allowance: Allowance
  onAcceptChanges: () => void
  clearSwapState: () => void
  onConfirm: () => void
  swapError?: Error
  onDismiss: () => void
  onCurrencySelection: (field: Field, currency: Currency) => void
  fiatValueInput: { data?: number; isLoading: boolean }
  fiatValueOutput: { data?: number; isLoading: boolean }
}) {
  const { chainId } = useWeb3React()
  const doesTradeDiffer = originalTrade && tradeMeaningfullyDiffers(trade, originalTrade, allowedSlippage)
  const { startSwapFlow, onCancel, confirmModalState, approvalError, pendingModalSteps, wrapTxHash } =
    useConfirmModalState({
      trade,
      allowedSlippage,
      onSwap: () => {
        clearSwapState()
        onConfirm()
      },
      onCurrencySelection,
      allowance,
      doesTradeDiffer: Boolean(doesTradeDiffer),
    })

  const swapStatus = useSwapTransactionStatus(swapResult)

  // Swap was reverted onchain.
  const swapReverted = swapStatus === TransactionStatus.Failed
  // Swap failed locally and was not broadcast to the blockchain.
  const localSwapFailure = Boolean(swapError) && !didUserReject(swapError)
  const swapFailed = localSwapFailure || swapReverted

  useEffect(() => {
    // Reset the modal state if the user rejected the swap.
    if (swapError && !swapFailed) {
      onCancel()
    }
  }, [onCancel, swapError, swapFailed])

  const showAcceptChanges = Boolean(
    trade && doesTradeDiffer && confirmModalState !== ConfirmModalState.PENDING_CONFIRMATION
  )

  const [lastExecutionPrice, setLastExecutionPrice] = useState(trade?.executionPrice)
  const [priceUpdate, setPriceUpdate] = useState<number>()
  useEffect(() => {
    if (lastExecutionPrice && !trade.executionPrice.equalTo(lastExecutionPrice)) {
      setPriceUpdate(getPriceUpdateBasisPoints(lastExecutionPrice, trade.executionPrice))
      setLastExecutionPrice(trade.executionPrice)
    }
  }, [lastExecutionPrice, setLastExecutionPrice, trade])

  const onModalDismiss = useCallback(() => {
    if (showAcceptChanges) {
      // If the user dismissed the modal while showing the price update, log the event as rejected.
      sendAnalyticsEvent(
        SwapEventName.SWAP_PRICE_UPDATE_ACKNOWLEDGED,
        formatSwapPriceUpdatedEventProperties(trade, priceUpdate, SwapPriceUpdateUserResponse.REJECTED)
      )
    }
    onDismiss()
    setTimeout(() => {
      // Reset local state after the modal dismiss animation finishes, to avoid UI flicker as it dismisses
      onCancel()
    }, MODAL_TRANSITION_DURATION)
  }, [onCancel, onDismiss, priceUpdate, showAcceptChanges, trade])

  const modalHeader = useCallback(() => {
    if (confirmModalState !== ConfirmModalState.REVIEWING && !showAcceptChanges) {
      return null
    }
    return <SwapModalHeader inputCurrency={inputCurrency} trade={trade} allowedSlippage={allowedSlippage} />
  }, [allowedSlippage, confirmModalState, showAcceptChanges, trade, inputCurrency])

  const modalBottom = useCallback(() => {
    if (confirmModalState === ConfirmModalState.REVIEWING || showAcceptChanges) {
      return (
        <SwapModalFooter
          onConfirm={startSwapFlow}
          trade={trade}
          swapResult={swapResult}
          allowedSlippage={allowedSlippage}
          isLoading={isPreviewTrade(trade)}
          disabledConfirm={showAcceptChanges || isPreviewTrade(trade) || allowance.state === AllowanceState.LOADING}
          fiatValueInput={fiatValueInput}
          fiatValueOutput={fiatValueOutput}
          showAcceptChanges={showAcceptChanges}
          onAcceptChanges={onAcceptChanges}
          swapErrorMessage={swapFailed ? swapError?.message : undefined}
        />
      )
    }
    return (
      <PendingModalContent
        hideStepIndicators={pendingModalSteps.length === 1}
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
    )
  }, [
    confirmModalState,
    showAcceptChanges,
    pendingModalSteps,
    trade,
    swapResult,
    wrapTxHash,
    allowance,
    swapError,
    startSwapFlow,
    allowedSlippage,
    fiatValueInput,
    fiatValueOutput,
    onAcceptChanges,
    swapFailed,
    onConfirm,
  ])

  const l2Badge = () => {
    if (isL2ChainId(chainId) && confirmModalState !== ConfirmModalState.REVIEWING) {
      const info = getChainInfo(chainId)
      return (
        <StyledL2Badge>
          <RowFixed data-testid="confirmation-modal-chain-icon" gap="sm">
            <ChainLogo chainId={chainId} size={16} />
            <ThemedText.SubHeaderSmall>{info.label}</ThemedText.SubHeaderSmall>
          </RowFixed>
        </StyledL2Badge>
      )
    }
    return undefined
  }

  const getErrorType = () => {
    if (approvalError) return approvalError
    // SignatureExpiredError is a special case. The UI is shown in the PendingModalContent component.
    if (swapError instanceof SignatureExpiredError) return
    if (swapError && !didUserReject(swapError)) return PendingModalError.CONFIRMATION_ERROR
    return
  }
  const errorType = getErrorType()

  return (
    <Trace modal={InterfaceModalName.CONFIRM_SWAP}>
      <Modal isOpen $scrollOverlay onDismiss={onModalDismiss} maxHeight={90}>
        {errorType ? (
          <ErrorModalContent errorType={errorType} onRetry={startSwapFlow} />
        ) : (
          <ConfirmationModalContent
            title={confirmModalState === ConfirmModalState.REVIEWING ? <Trans>Review swap</Trans> : undefined}
            onDismiss={onModalDismiss}
            topContent={modalHeader}
            bottomContent={modalBottom}
            headerContent={l2Badge}
          />
        )}
      </Modal>
    </Trace>
  )
}
