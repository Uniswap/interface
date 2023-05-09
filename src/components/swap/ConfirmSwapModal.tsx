import { t, Trans } from '@lingui/macro'
import { sendAnalyticsEvent, Trace, useTrace } from '@uniswap/analytics'
import { InterfaceEventName, InterfaceModalName } from '@uniswap/analytics-events'
import { Trade } from '@uniswap/router-sdk'
import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import Modal from 'components/Modal'
import { useMaxAmountIn } from 'hooks/useMaxAmountIn'
import { Allowance, AllowanceState } from 'hooks/usePermit2Allowance'
import usePrevious from 'hooks/usePrevious'
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { InterfaceTrade } from 'state/routing/types'
import { useIsTransactionConfirmed, useTransaction } from 'state/transactions/hooks'
import invariant from 'tiny-invariant'
import { tradeMeaningfullyDiffers } from 'utils/tradeMeaningFullyDiffer'

import { ConfirmationModalContent, TransactionErrorContent } from '../TransactionConfirmationModal'
import { PendingModalContent, PendingModalStep } from './PendingModalContent'
import SwapModalFooter from './SwapModalFooter'
import SwapModalHeader from './SwapModalHeader'

enum SummaryModalState {
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
  const [confirmModalState, setConfirmModalState] = useState<SummaryModalState>(SummaryModalState.REVIEWING)
  const showAcceptChanges = useMemo(
    () =>
      Boolean(
        trade &&
          originalTrade &&
          tradeMeaningfullyDiffers(trade, originalTrade) &&
          // no point in resetting the UI if the transaction is already sent.
          confirmModalState !== SummaryModalState.PENDING_CONFIRMATION
      ),
    [confirmModalState, originalTrade, trade]
  )

  const { chainId } = useWeb3React()
  const trace = useTrace()
  const maximumAmountIn = useMaxAmountIn(trade, allowedSlippage)
  const [totalSteps, setTotalSteps] = useState(1)
  const [pendingModalSteps, setPendingModalSteps] = useState<PendingModalStep[]>([])
  const [currentStep, setCurrentStep] = useState(0)

  const transaction = useTransaction(txHash)
  const confirmed = useIsTransactionConfirmed(txHash)
  const transactionSuccess = transaction?.receipt?.status === 1

  useEffect(() => {
    if (
      !showAcceptChanges &&
      confirmModalState === SummaryModalState.ALLOWING &&
      allowance.state === AllowanceState.ALLOWED
    ) {
      setCurrentStep(totalSteps - 1)
      onConfirm()
      setConfirmModalState(SummaryModalState.PENDING_CONFIRMATION)
    }
  }, [allowance, confirmModalState, currentStep, onConfirm, showAcceptChanges, totalSteps])

  const previousPermitNeeded = usePrevious(
    allowance.state === AllowanceState.REQUIRED ? allowance.needsPermit2Approval : undefined
  )

  useEffect(() => {
    if (
      allowance.state === AllowanceState.REQUIRED &&
      !allowance.needsPermit2Approval &&
      previousPermitNeeded &&
      allowance.needsSignature
    ) {
      // We successfully requested Permit2 approval and need to move to the signature step.
      setCurrentStep(currentStep + 1)
    }
  }, [allowance, currentStep, previousPermitNeeded])

  const updateAllowance = useCallback(async () => {
    invariant(allowance.state === AllowanceState.REQUIRED)
    setConfirmModalState(SummaryModalState.ALLOWING)
    try {
      await allowance.approveAndPermit()
      sendAnalyticsEvent(InterfaceEventName.APPROVE_TOKEN_TXN_SUBMITTED, {
        chain_id: chainId,
        token_symbol: maximumAmountIn?.currency.symbol,
        token_address: maximumAmountIn?.currency.address,
        ...trace,
      })
    } catch (e) {
      console.error(e)
      // TODO: show error modal for unknown errors instead of reverting to summary view every time.
      return false
    }
    return true
  }, [allowance, chainId, maximumAmountIn?.currency.address, maximumAmountIn?.currency.symbol, trace])

  const onModalDismiss = useCallback(() => {
    if (isOpen) setShouldLogModalCloseEvent(true)
    onDismiss()
    setConfirmModalState(SummaryModalState.REVIEWING)
  }, [isOpen, onDismiss])

  const modalHeader = useCallback(() => {
    if (confirmModalState !== SummaryModalState.REVIEWING && !showAcceptChanges) {
      return null
    }
    return <SwapModalHeader trade={trade} allowedSlippage={allowedSlippage} />
  }, [allowedSlippage, confirmModalState, showAcceptChanges, trade])

  const modalBottom = useCallback(() => {
    if (confirmModalState !== SummaryModalState.REVIEWING && !showAcceptChanges) {
      return (
        <PendingModalContent
          steps={pendingModalSteps}
          activeStepIndex={currentStep}
          confirmed={confirmed}
          transactionSuccess={transactionSuccess}
        />
      )
    }
    return (
      <SwapModalFooter
        onConfirm={async () => {
          setTotalSteps(
            allowance.state === AllowanceState.REQUIRED
              ? 1 + (allowance.needsSignature ? 1 : 0) + (allowance.needsPermit2Approval ? 1 : 0)
              : 1
          )
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
          // todo: add success state to this step
          steps.push({
            title: t`Confirm Swap`,
            subtitle: t`Proceed in wallet`,
          })
          setPendingModalSteps(steps)
          if (allowance.state === AllowanceState.REQUIRED) {
            const allowanceResult: boolean = await updateAllowance()
            if (!allowanceResult) {
              setConfirmModalState(SummaryModalState.REVIEWING)
            }
          } else {
            setConfirmModalState(SummaryModalState.PENDING_CONFIRMATION)
            onConfirm()
          }
        }}
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
          setConfirmModalState(SummaryModalState.REVIEWING)
          onAcceptChanges()
        }}
      />
    )
  }, [
    confirmModalState,
    showAcceptChanges,
    trade,
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
    allowance,
    updateAllowance,
    onConfirm,
    onAcceptChanges,
  ])

  const confirmationContent = useCallback(
    () =>
      swapErrorMessage ? (
        <TransactionErrorContent onDismiss={onModalDismiss} message={swapErrorMessage} />
      ) : (
        <ConfirmationModalContent
          title={confirmModalState === SummaryModalState.REVIEWING ? <Trans>Review Swap</Trans> : undefined}
          onDismiss={onModalDismiss}
          topContent={modalHeader}
          bottomContent={modalBottom}
        />
      ),
    [swapErrorMessage, onModalDismiss, confirmModalState, modalHeader, modalBottom]
  )

  return (
    <Trace modal={InterfaceModalName.CONFIRM_SWAP}>
      <Modal isOpen={isOpen} $scrollOverlay={true} onDismiss={onModalDismiss} maxHeight={90}>
        {confirmationContent()}
      </Modal>
    </Trace>
  )
}
