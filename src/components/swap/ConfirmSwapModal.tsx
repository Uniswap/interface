import { t, Trans } from '@lingui/macro'
import { sendAnalyticsEvent, Trace, useTrace } from '@uniswap/analytics'
import { InterfaceEventName, InterfaceModalName } from '@uniswap/analytics-events'
import { Trade } from '@uniswap/router-sdk'
import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { ButtonPrimary } from 'components/Button'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import Modal from 'components/Modal'
import { useMaxAmountIn } from 'hooks/useMaxAmountIn'
import { Allowance, AllowanceState } from 'hooks/usePermit2Allowance'
import usePrevious from 'hooks/usePrevious'
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { InterfaceTrade } from 'state/routing/types'
import { useIsTransactionConfirmed, useTransaction } from 'state/transactions/hooks'
import invariant from 'tiny-invariant'
import { didUserReject } from 'utils/swapErrorToUserReadableMessage'
import { tradeMeaningfullyDiffers } from 'utils/tradeMeaningFullyDiffer'

import { ConfirmationModalContent, TransactionErrorContent } from '../TransactionConfirmationModal'
import { PendingModalContent, PendingModalStep } from './PendingModalContent'
import SwapModalFooter from './SwapModalFooter'
import SwapModalHeader from './SwapModalHeader'

enum ConfirmModalState {
  REVIEWING,
  ALLOWING,
  PENDING_CONFIRMATION,
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
  const [pendingModalSteps, setPendingModalSteps] = useState<PendingModalStep[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [approvalError, setApprovalError] = useState<'permit_approval' | 'token_approval' | undefined>(undefined)

  const transaction = useTransaction(txHash)
  const confirmed = useIsTransactionConfirmed(txHash)
  const transactionSuccess = transaction?.receipt?.status === 1

  useEffect(() => {
    if (
      !showAcceptChanges &&
      confirmModalState === ConfirmModalState.ALLOWING &&
      allowance.state === AllowanceState.ALLOWED
    ) {
      setCurrentStep(pendingModalSteps.length - 1)
      onConfirm()
      setConfirmModalState(ConfirmModalState.PENDING_CONFIRMATION)
    }
  }, [allowance, confirmModalState, currentStep, onConfirm, pendingModalSteps.length, showAcceptChanges])

  const previousPermitNeeded = usePrevious(
    allowance.state === AllowanceState.REQUIRED ? allowance.needsPermit2Approval : undefined
  )
  useEffect(() => {
    async function requestSignature() {
      // We successfully requested Permit2 approval and need to move to the signature step.
      setCurrentStep(currentStep + 1)
      try {
        allowance.state === AllowanceState.REQUIRED && (await allowance.permit())
      } catch (e) {
        setConfirmModalState(ConfirmModalState.REVIEWING)
        if (didUserReject(e)) {
          return
        }
        console.error(e)
        setApprovalError('token_approval')
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
  }, [allowance, currentStep, previousPermitNeeded])

  const updateAllowance = useCallback(async () => {
    invariant(allowance.state === AllowanceState.REQUIRED)
    setConfirmModalState(ConfirmModalState.ALLOWING)
    try {
      if (allowance.needsPermit2Approval) {
        await allowance.approve()
      } else {
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
      setApprovalError('permit_approval')
    }
    return true
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
    setCurrentStep(0)
    const steps: PendingModalStep[] = []
    if (allowance.state === AllowanceState.REQUIRED && allowance.needsPermit2Approval) {
      steps.push({
        title: t`Approve permit`,
        subtitle: t`Proceed in wallet`,
        label: t`Why are permits required?`,
        tooltipText: t`Permit2 allows token approvals to be shared and managed across different applications.`,
        logo: <CurrencyLogo currency={trade?.inputAmount?.currency} size="48px" />,
      })
    }
    if (allowance.state === AllowanceState.REQUIRED && allowance.needsSignature) {
      steps.push({
        title: t`Approve ${trade?.inputAmount?.currency?.symbol}`,
        subtitle: t`Proceed in wallet`,
        label: t`Why are approvals required?`,
        tooltipText: t`This provides the Uniswap protocol access to your token for trading. For security, this will expire after 30 days.`,
        logo: <CurrencyLogo currency={trade?.inputAmount?.currency} size="48px" />,
      })
    }
    steps.push({
      title: t`Confirm Swap`,
      subtitle: t`Proceed in wallet`,
    })
    setPendingModalSteps(steps)
  }, [allowance, trade?.inputAmount?.currency])

  const modalHeader = useCallback(() => {
    if (confirmModalState !== ConfirmModalState.REVIEWING && !showAcceptChanges) {
      return null
    }
    return <SwapModalHeader trade={trade} allowedSlippage={allowedSlippage} />
  }, [allowedSlippage, confirmModalState, showAcceptChanges, trade])

  const startApproveAndSwapFlow = useCallback(() => {
    setApprovalError(undefined)
    async function startFlow() {
      prepareSwapFlow()
      if (allowance.state === AllowanceState.REQUIRED) {
        await updateAllowance()
      } else {
        setConfirmModalState(ConfirmModalState.PENDING_CONFIRMATION)
        onConfirm()
      }
    }
    startFlow()
  }, [allowance.state, onConfirm, prepareSwapFlow, updateAllowance])

  const modalBottom = useCallback(() => {
    if (confirmModalState !== ConfirmModalState.REVIEWING && !showAcceptChanges) {
      return (
        <PendingModalContent
          hideStepIndicators={pendingModalSteps.length === 1}
          steps={pendingModalSteps}
          activeStepIndex={currentStep}
          confirmed={confirmed}
          transactionSuccess={transactionSuccess}
        />
      )
    }
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
    currentStep,
    confirmed,
    transactionSuccess,
    onAcceptChanges,
  ])

  return (
    <Trace modal={InterfaceModalName.CONFIRM_SWAP}>
      <Modal isOpen={isOpen} $scrollOverlay={true} onDismiss={onModalDismiss} maxHeight={90}>
        {approvalError ? (
          <PendingModalContent
            hideStepIndicators
            steps={[
              {
                title: approvalError === 'permit_approval' ? t`Permit approval failed` : t`Token approval failed`,
                label:
                  approvalError === 'permit_approval' ? t`Why are permits required?` : t`Why are approvals required?`,
                tooltipText:
                  approvalError === 'permit_approval'
                    ? t`Permit2 allows token approvals to be shared and managed across different applications.`
                    : t`This provides the Uniswap protocol access to your token for trading. For security, this will expire after 30 days.`,
                button: (
                  <ButtonPrimary marginX="24px" onClick={startApproveAndSwapFlow}>
                    <Trans>Retry</Trans>
                  </ButtonPrimary>
                ),
              },
            ]}
            activeStepIndex={0}
            confirmed={true}
            transactionSuccess={false}
          />
        ) : swapErrorMessage ? (
          <TransactionErrorContent onDismiss={onModalDismiss} message={swapErrorMessage} />
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
