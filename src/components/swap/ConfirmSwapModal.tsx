import { Trans } from '@lingui/macro'
import { sendAnalyticsEvent, Trace, useTrace } from '@uniswap/analytics'
import {
  InterfaceEventName,
  InterfaceModalName,
  SwapEventName,
  SwapPriceUpdateUserResponse,
} from '@uniswap/analytics-events'
import { Percent } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import Modal from 'components/Modal'
import { useMaxAmountIn } from 'hooks/useMaxAmountIn'
import { Allowance, AllowanceState } from 'hooks/usePermit2Allowance'
import usePrevious from 'hooks/usePrevious'
import { getPriceUpdateBasisPoints } from 'lib/utils/analytics'
import { ReactNode, useCallback, useEffect, useState } from 'react'
import { InterfaceTrade } from 'state/routing/types'
import invariant from 'tiny-invariant'
import { formatSwapPriceUpdatedEventProperties } from 'utils/loggingFormatters'
import { didUserReject } from 'utils/swapErrorToUserReadableMessage'
import { tradeMeaningfullyDiffers } from 'utils/tradeMeaningFullyDiffer'

import { ConfirmationModalContent } from '../TransactionConfirmationModal'
import {
  ErrorModalContent,
  PendingConfirmModalState,
  PendingModalContent,
  PendingModalError,
} from './PendingModalContent'
import SwapModalFooter from './SwapModalFooter'
import SwapModalHeader from './SwapModalHeader'

export enum ConfirmModalState {
  REVIEWING,
  APPROVING_TOKEN,
  PERMITTING,
  PENDING_CONFIRMATION,
}

function isAllowing(confirmModalState: ConfirmModalState) {
  return confirmModalState === ConfirmModalState.APPROVING_TOKEN || confirmModalState === ConfirmModalState.PERMITTING
}

function useConfirmModalState({
  trade,
  allowedSlippage,
  onSwap,
  allowance,
  doesTradeDiffer,
}: {
  trade: InterfaceTrade
  allowedSlippage: Percent
  onSwap: () => void
  allowance: Allowance
  doesTradeDiffer: boolean
}) {
  const [confirmModalState, setConfirmModalState] = useState<ConfirmModalState>(ConfirmModalState.REVIEWING)
  const [approvalError, setApprovalError] = useState<PendingModalError>()
  const [pendingModalSteps, setPendingModalSteps] = useState<PendingConfirmModalState[]>([])

  const prepareSwapFlow = useCallback(() => {
    const steps: PendingConfirmModalState[] = []
    if (allowance.state === AllowanceState.REQUIRED && allowance.needsPermit2Approval) {
      steps.push(ConfirmModalState.APPROVING_TOKEN)
    }
    if (allowance.state === AllowanceState.REQUIRED && allowance.needsSignature) {
      steps.push(ConfirmModalState.PERMITTING)
    }
    steps.push(ConfirmModalState.PENDING_CONFIRMATION)
    setPendingModalSteps(steps)
  }, [allowance])

  const { chainId } = useWeb3React()
  const trace = useTrace()
  const maximumAmountIn = useMaxAmountIn(trade, allowedSlippage)
  // Starts the approval process, by triggering either the Token Approval or the Permit signature.
  const updateAllowance = useCallback(async () => {
    invariant(allowance.state === AllowanceState.REQUIRED)
    try {
      if (allowance.needsPermit2Approval) {
        setConfirmModalState(ConfirmModalState.APPROVING_TOKEN)
        await allowance.approve()
        sendAnalyticsEvent(InterfaceEventName.APPROVE_TOKEN_TXN_SUBMITTED, {
          chain_id: chainId,
          token_symbol: maximumAmountIn?.currency.symbol,
          token_address: maximumAmountIn?.currency.address,
          ...trace,
        })
      } else {
        setConfirmModalState(ConfirmModalState.PERMITTING)
        await allowance.permit()
      }
    } catch (e) {
      setConfirmModalState(ConfirmModalState.REVIEWING)
      if (didUserReject(e)) {
        return
      }
      console.error(e)
      setApprovalError(
        allowance.needsPermit2Approval ? PendingModalError.TOKEN_APPROVAL_ERROR : PendingModalError.PERMIT_ERROR
      )
    }
  }, [allowance, chainId, maximumAmountIn?.currency.address, maximumAmountIn?.currency.symbol, trace])

  const onStartSwapFlow = useCallback(async () => {
    setApprovalError(undefined)
    if (allowance.state === AllowanceState.REQUIRED) {
      await updateAllowance()
    } else {
      setConfirmModalState(ConfirmModalState.PENDING_CONFIRMATION)
      onSwap()
    }
  }, [allowance.state, onSwap, updateAllowance])

  const previousPermitNeeded = usePrevious(
    allowance.state === AllowanceState.REQUIRED ? allowance.needsPermit2Approval : undefined
  )
  useEffect(() => {
    if (
      allowance.state === AllowanceState.REQUIRED &&
      allowance.needsSignature &&
      // These two lines capture the state update that should trigger the signature request:
      !allowance.needsPermit2Approval &&
      previousPermitNeeded
    ) {
      updateAllowance()
    }
  }, [allowance, previousPermitNeeded, updateAllowance])

  // Automatically triggers signing swap tx if allowance requirements are met
  useEffect(() => {
    if (isAllowing(confirmModalState) && allowance.state === AllowanceState.ALLOWED) {
      // Prevents immediate swap if trade has updated mid approval flow
      if (doesTradeDiffer) {
        setConfirmModalState(ConfirmModalState.REVIEWING)
        return
      } else {
        onStartSwapFlow()
      }
    }
  }, [allowance, confirmModalState, doesTradeDiffer, onStartSwapFlow])

  const onCancel = useCallback(() => {
    setConfirmModalState(ConfirmModalState.REVIEWING)
    setApprovalError(undefined)
  }, [])
  return { onStartSwapFlow, prepareSwapFlow, onCancel, confirmModalState, approvalError, pendingModalSteps }
}

export default function ConfirmSwapModal({
  trade,
  originalTrade,
  onAcceptChanges,
  allowedSlippage,
  allowance,
  onConfirm,
  onDismiss,
  swapErrorMessage,
  txHash,
  swapQuoteReceivedDate,
  fiatValueInput,
  fiatValueOutput,
}: {
  trade: InterfaceTrade
  originalTrade: InterfaceTrade | undefined
  txHash: string | undefined
  allowedSlippage: Percent
  allowance: Allowance
  onAcceptChanges: () => void
  onConfirm: () => void
  swapErrorMessage: ReactNode | undefined
  onDismiss: () => void
  swapQuoteReceivedDate: Date | undefined
  fiatValueInput: { data?: number; isLoading: boolean }
  fiatValueOutput: { data?: number; isLoading: boolean }
}) {
  const doesTradeDiffer = originalTrade && tradeMeaningfullyDiffers(trade, originalTrade, allowedSlippage)
  const { onStartSwapFlow, prepareSwapFlow, onCancel, confirmModalState, approvalError, pendingModalSteps } =
    useConfirmModalState({
      trade,
      allowedSlippage,
      onSwap: onConfirm,
      allowance,
      doesTradeDiffer: Boolean(doesTradeDiffer),
    })

  const showAcceptChanges = Boolean(trade && doesTradeDiffer && confirmModalState === ConfirmModalState.REVIEWING)

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
    }, 200)
  }, [onCancel, onDismiss, priceUpdate, showAcceptChanges, trade])

  const modalHeader = useCallback(() => {
    if (confirmModalState !== ConfirmModalState.REVIEWING && !showAcceptChanges) {
      return null
    }
    return <SwapModalHeader trade={trade} allowedSlippage={allowedSlippage} />
  }, [allowedSlippage, confirmModalState, showAcceptChanges, trade])

  const modalBottom = useCallback(() => {
    if (confirmModalState === ConfirmModalState.REVIEWING || showAcceptChanges) {
      return (
        <SwapModalFooter
          onConfirm={() => {
            // Calculate the necessary steps once, before starting the flow.
            prepareSwapFlow()
            onStartSwapFlow()
          }}
          trade={trade}
          hash={txHash}
          allowedSlippage={allowedSlippage}
          disabledConfirm={showAcceptChanges}
          swapErrorMessage={swapErrorMessage}
          swapQuoteReceivedDate={swapQuoteReceivedDate}
          fiatValueInput={fiatValueInput}
          fiatValueOutput={fiatValueOutput}
          showAcceptChanges={showAcceptChanges}
          onAcceptChanges={onAcceptChanges}
        />
      )
    }
    return (
      <PendingModalContent
        hideStepIndicators={pendingModalSteps.length === 1}
        steps={pendingModalSteps}
        currentStep={confirmModalState}
        trade={trade}
        swapHash={txHash}
        tokenApprovalPending={allowance.state === AllowanceState.REQUIRED && allowance.isApprovalPending}
      />
    )
  }, [
    confirmModalState,
    showAcceptChanges,
    pendingModalSteps,
    trade,
    txHash,
    allowance,
    allowedSlippage,
    swapErrorMessage,
    swapQuoteReceivedDate,
    fiatValueInput,
    fiatValueOutput,
    onAcceptChanges,
    prepareSwapFlow,
    onStartSwapFlow,
  ])

  return (
    <Trace modal={InterfaceModalName.CONFIRM_SWAP}>
      <Modal isOpen $scrollOverlay={true} onDismiss={onModalDismiss} maxHeight={90}>
        {approvalError || swapErrorMessage ? (
          <ErrorModalContent
            errorType={approvalError ?? PendingModalError.CONFIRMATION_ERROR}
            onRetry={onStartSwapFlow}
          />
        ) : (
          <ConfirmationModalContent
            title={confirmModalState === ConfirmModalState.REVIEWING ? <Trans>Review Swap</Trans> : undefined}
            onDismiss={onModalDismiss}
            topContent={modalHeader}
            bottomContent={modalBottom}
          />
        )}
      </Modal>
    </Trace>
  )
}
