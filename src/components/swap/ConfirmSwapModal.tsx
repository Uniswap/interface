import { Trans } from '@lingui/macro'
import { sendAnalyticsEvent, Trace, useTrace } from '@uniswap/analytics'
import { InterfaceEventName, InterfaceModalName } from '@uniswap/analytics-events'
import { Trade } from '@uniswap/router-sdk'
import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import Modal from 'components/Modal'
import { useMaxAmountIn } from 'hooks/useMaxAmountIn'
import { Allowance, AllowanceState } from 'hooks/usePermit2Allowance'
import usePrevious from 'hooks/usePrevious'
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { InterfaceTrade } from 'state/routing/types'
import { useIsTransactionConfirmed } from 'state/transactions/hooks'
import invariant from 'tiny-invariant'
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

export default function ConfirmSwapModal({
  trade,
  originalTrade,
  onAcceptChanges,
  allowedSlippage,
  allowance,
  onConfirm,
  onDismiss,
  swapErrorMessage,
  isOpen,
  txHash,
  swapQuoteReceivedDate,
  fiatValueInput,
  fiatValueOutput,
}: {
  isOpen: boolean
  trade: InterfaceTrade<Currency, Currency, TradeType> | undefined
  originalTrade: Trade<Currency, Currency, TradeType> | undefined
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
  // shouldLogModalCloseEvent lets the child SwapModalHeader component know when modal has been closed
  // and an event triggered by modal closing should be logged.
  const [shouldLogModalCloseEvent, setShouldLogModalCloseEvent] = useState(false)
  const [confirmModalState, setConfirmModalState] = useState<ConfirmModalState>(ConfirmModalState.REVIEWING)
  const [pendingModalSteps, setPendingModalSteps] = useState<PendingConfirmModalState[]>([])

  const showAcceptChanges = useMemo(
    () =>
      Boolean(
        trade &&
          originalTrade &&
          tradeMeaningfullyDiffers(trade, originalTrade) &&
          confirmModalState !== ConfirmModalState.PENDING_CONFIRMATION
      ),
    [confirmModalState, originalTrade, trade]
  )

  const { chainId } = useWeb3React()
  const trace = useTrace()
  const maximumAmountIn = useMaxAmountIn(trade, allowedSlippage)
  const [approvalError, setApprovalError] = useState<PendingModalError>()

  const confirmed = useIsTransactionConfirmed(txHash)

  useEffect(() => {
    if (!showAcceptChanges && isAllowing(confirmModalState) && allowance.state === AllowanceState.ALLOWED) {
      onConfirm()
      setConfirmModalState(ConfirmModalState.PENDING_CONFIRMATION)
    }
  }, [allowance, confirmModalState, onConfirm, pendingModalSteps.length, showAcceptChanges])

  const previousPermitNeeded = usePrevious(
    allowance.state === AllowanceState.REQUIRED ? allowance.needsPermit2Approval : undefined
  )
  useEffect(() => {
    async function requestSignature() {
      // We successfully requested Permit2 approval and need to move to the signature step.
      try {
        if (allowance.state === AllowanceState.REQUIRED) {
          setConfirmModalState(ConfirmModalState.PERMITTING)
          await allowance.permit()
        }
      } catch (e) {
        setConfirmModalState(ConfirmModalState.REVIEWING)
        if (didUserReject(e)) {
          return
        }
        console.error(e)
        setApprovalError(PendingModalError.TOKEN_APPROVAL_ERROR)
      }
    }
    if (
      allowance.state === AllowanceState.REQUIRED &&
      allowance.needsSignature &&
      // These two lines capture the state update that should trigger the signature request:
      !allowance.needsPermit2Approval &&
      previousPermitNeeded
    ) {
      requestSignature()
    }
  }, [allowance, previousPermitNeeded])

  const updateAllowance = useCallback(async () => {
    invariant(allowance.state === AllowanceState.REQUIRED)
    try {
      if (allowance.needsPermit2Approval) {
        setConfirmModalState(ConfirmModalState.APPROVING_TOKEN)
        await allowance.approve()
      } else {
        setConfirmModalState(ConfirmModalState.PERMITTING)
        await allowance.permit()
      }
      sendAnalyticsEvent(InterfaceEventName.APPROVE_TOKEN_TXN_SUBMITTED, {
        chain_id: chainId,
        token_symbol: maximumAmountIn?.currency.symbol,
        token_address: maximumAmountIn?.currency.address,
        ...trace,
      })
    } catch (e) {
      setConfirmModalState(ConfirmModalState.REVIEWING)
      if (didUserReject(e)) {
        return
      }
      console.error(e)
      setApprovalError(PendingModalError.PERMIT_ERROR)
    }
  }, [allowance, chainId, maximumAmountIn?.currency.address, maximumAmountIn?.currency.symbol, trace])

  const onModalDismiss = useCallback(() => {
    if (isOpen) setShouldLogModalCloseEvent(true)
    onDismiss()
    setTimeout(() => {
      // Reset local state after the modal dismiss animation finishes, to avoid UI flicker as it dismisses
      setConfirmModalState(ConfirmModalState.REVIEWING)
      setApprovalError(undefined)
    }, 200)
  }, [isOpen, onDismiss])

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

  const modalHeader = useCallback(() => {
    if (confirmModalState !== ConfirmModalState.REVIEWING && !showAcceptChanges) {
      return null
    }
    return <SwapModalHeader trade={trade} allowedSlippage={allowedSlippage} />
  }, [allowedSlippage, confirmModalState, showAcceptChanges, trade])

  const startApproveAndSwapFlow = useCallback(async () => {
    setApprovalError(undefined)
    prepareSwapFlow()
    if (allowance.state === AllowanceState.REQUIRED) {
      await updateAllowance()
    } else {
      setConfirmModalState(ConfirmModalState.PENDING_CONFIRMATION)
      onConfirm()
    }
  }, [allowance.state, onConfirm, prepareSwapFlow, updateAllowance])

  const modalBottom = useCallback(() => {
    if (confirmModalState === ConfirmModalState.REVIEWING || showAcceptChanges) {
      return (
        <SwapModalFooter
          onConfirm={startApproveAndSwapFlow}
          trade={trade}
          hash={txHash}
          allowedSlippage={allowedSlippage}
          disabledConfirm={showAcceptChanges}
          swapErrorMessage={swapErrorMessage}
          swapQuoteReceivedDate={swapQuoteReceivedDate}
          fiatValueInput={fiatValueInput}
          fiatValueOutput={fiatValueOutput}
          shouldLogModalCloseEvent={shouldLogModalCloseEvent}
          setShouldLogModalCloseEvent={setShouldLogModalCloseEvent}
          showAcceptChanges={showAcceptChanges}
          onAcceptChanges={() => {
            setConfirmModalState(ConfirmModalState.REVIEWING)
            onAcceptChanges()
          }}
        />
      )
    }
    return (
      <PendingModalContent
        hideStepIndicators={pendingModalSteps.length === 1}
        steps={pendingModalSteps}
        currentStep={confirmModalState}
        approvalCurrency={trade?.inputAmount?.currency}
        confirmed={confirmed}
      />
    )
  }, [
    confirmModalState,
    showAcceptChanges,
    trade,
    startApproveAndSwapFlow,
    txHash,
    allowedSlippage,
    swapErrorMessage,
    swapQuoteReceivedDate,
    fiatValueInput,
    fiatValueOutput,
    shouldLogModalCloseEvent,
    pendingModalSteps,
    confirmed,
    onAcceptChanges,
  ])

  return (
    <Trace modal={InterfaceModalName.CONFIRM_SWAP}>
      <Modal isOpen={isOpen} $scrollOverlay={true} onDismiss={onModalDismiss} maxHeight={90}>
        {approvalError || swapErrorMessage ? (
          <ErrorModalContent
            errorType={approvalError ?? PendingModalError.CONFIRMATION_ERROR}
            onRetry={startApproveAndSwapFlow}
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
