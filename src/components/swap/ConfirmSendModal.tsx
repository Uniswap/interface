import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { ButtonError } from 'components/Button'
import Modal, { MODAL_TRANSITION_DURATION } from 'components/Modal'
import { ConfirmationModalContent } from 'components/TransactionConfirmationModal'
import { PYUSD } from 'constants/tokens'
import { Allowance, AllowanceState } from 'hooks/usePermit2Allowance'
import usePrevious from 'hooks/usePrevious'
import { RecipientInput, ResolvedRecipient } from 'pages/Swap/Pay'
import { useCallback, useEffect, useState } from 'react'
import { Text } from 'rebass'
import invariant from 'tiny-invariant'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'
import { didUserReject } from 'utils/swapErrorToUserReadableMessage'

import { ConfirmModalState } from './ConfirmSwapModal'
import { RESET_APPROVAL_TOKENS } from './constants'
import { PendingConfirmModalState, PendingModalContent } from './PendingModalContent'
import { PendingModalError } from './PendingModalContent/ErrorModalContent'

function isInApprovalPhase(confirmModalState: ConfirmModalState) {
  return (
    confirmModalState === ConfirmModalState.RESETTING_TOKEN_ALLOWANCE ||
    confirmModalState === ConfirmModalState.APPROVING_TOKEN ||
    confirmModalState === ConfirmModalState.PERMITTING
  )
}

function useConfirmModalState({
  onSend,
  onSwap,
  allowance,
  recipient,
  inputCurrency,
}: {
  recipient: ResolvedRecipient
  onSend: () => void
  onSwap: () => void
  allowance: Allowance
  inputCurrency: Currency
}) {
  const [confirmModalState, setConfirmModalState] = useState<ConfirmModalState>(ConfirmModalState.REVIEWING)
  const [approvalError, setApprovalError] = useState<PendingModalError>()
  const [pendingModalSteps, setPendingModalSteps] = useState<PendingConfirmModalState[]>([])

  // This is a function instead of a memoized value because we do _not_ want it to update as the allowance changes.
  // For example, if the user needs to complete 3 steps initially, we should always show 3 step indicators
  // at the bottom of the modal, even after they complete steps 1 and 2.
  const generateRequiredSteps = useCallback(() => {
    const needsSwapToPYUSD = recipient.type === 'venmo' && !PYUSD.equals(inputCurrency)
    const steps: PendingConfirmModalState[] = []
    if (
      needsSwapToPYUSD &&
      allowance.state === AllowanceState.REQUIRED &&
      allowance.needsSetupApproval &&
      RESET_APPROVAL_TOKENS.some((token) => token.equals(allowance.token)) &&
      allowance.allowedAmount.greaterThan(0)
    ) {
      steps.push(ConfirmModalState.RESETTING_TOKEN_ALLOWANCE)
    }
    if (needsSwapToPYUSD && allowance.state === AllowanceState.REQUIRED && allowance.needsSetupApproval) {
      steps.push(ConfirmModalState.APPROVING_TOKEN)
    }
    if (needsSwapToPYUSD && allowance.state === AllowanceState.REQUIRED && allowance.needsPermitSignature) {
      steps.push(ConfirmModalState.PERMITTING)
    }
    if (needsSwapToPYUSD) {
      steps.push(ConfirmModalState.SWAP_TO_PYUSD)
    }
    steps.push(ConfirmModalState.PENDING_SEND)
    return steps
  }, [allowance, inputCurrency, recipient.type])

  const catchUserReject = async (e: any, errorType: PendingModalError) => {
    setConfirmModalState(ConfirmModalState.REVIEWING)
    if (didUserReject(e)) return
    console.error(e)
    setApprovalError(errorType)
  }

  const performStep = useCallback(
    async (step: ConfirmModalState) => {
      switch (step) {
        case ConfirmModalState.RESETTING_TOKEN_ALLOWANCE:
          setConfirmModalState(ConfirmModalState.RESETTING_TOKEN_ALLOWANCE)
          invariant(allowance.state === AllowanceState.REQUIRED, 'Allowance should be required')
          allowance.revoke().catch((e) => catchUserReject(e, PendingModalError.TOKEN_APPROVAL_ERROR))
          break
        case ConfirmModalState.APPROVING_TOKEN:
          setConfirmModalState(ConfirmModalState.APPROVING_TOKEN)
          invariant(allowance.state === AllowanceState.REQUIRED, 'Allowance should be required')
          allowance.approve().catch((e) => catchUserReject(e, PendingModalError.TOKEN_APPROVAL_ERROR))
          break
        case ConfirmModalState.PERMITTING:
          setConfirmModalState(ConfirmModalState.PERMITTING)
          invariant(allowance.state === AllowanceState.REQUIRED, 'Allowance should be required')
          allowance.permit().catch((e) => catchUserReject(e, PendingModalError.TOKEN_APPROVAL_ERROR))
          break
        case ConfirmModalState.SWAP_TO_PYUSD:
          setConfirmModalState(ConfirmModalState.SWAP_TO_PYUSD)
          try {
            onSwap()
          } catch (e) {
            catchUserReject(e, PendingModalError.WRAP_ERROR)
          }
          break
        case ConfirmModalState.PENDING_SEND:
          setConfirmModalState(ConfirmModalState.PENDING_SEND)
          try {
            onSend()
          } catch (e) {
            catchUserReject(e, PendingModalError.CONFIRMATION_ERROR)
          }
          break
        default:
          setConfirmModalState(ConfirmModalState.REVIEWING)
          break
      }
    },
    [allowance, onSend, onSwap]
  )

  const startSwapFlow = useCallback(() => {
    const steps = generateRequiredSteps()
    setPendingModalSteps(steps)
    performStep(steps[0])
  }, [generateRequiredSteps, performStep])

  const previousSetupApprovalNeeded = usePrevious(
    allowance.state === AllowanceState.REQUIRED ? allowance.needsSetupApproval : undefined
  )

  useEffect(() => {
    if (
      allowance.state === AllowanceState.REQUIRED &&
      allowance.needsPermitSignature &&
      // If the token approval switched from missing to fulfilled, trigger the next step (permit2 signature).
      !allowance.needsSetupApproval &&
      previousSetupApprovalNeeded
    ) {
      performStep(ConfirmModalState.PERMITTING)
    }
  }, [allowance, performStep, previousSetupApprovalNeeded])

  const previousRevocationPending = usePrevious(
    allowance.state === AllowanceState.REQUIRED && allowance.isRevocationPending
  )
  useEffect(() => {
    if (allowance.state === AllowanceState.REQUIRED && previousRevocationPending && !allowance.isRevocationPending) {
      performStep(ConfirmModalState.APPROVING_TOKEN)
    }
  }, [allowance, performStep, previousRevocationPending])

  useEffect(() => {
    // Automatically triggers the next phase if the local modal state still thinks we're in the approval phase,
    // but the allowance has been set. This will automaticaly trigger the swap.
    if (isInApprovalPhase(confirmModalState) && allowance.state === AllowanceState.ALLOWED) {
      performStep(ConfirmModalState.PENDING_CONFIRMATION)
    }
  }, [allowance, confirmModalState, performStep])

  const onCancel = () => {
    setConfirmModalState(ConfirmModalState.REVIEWING)
    setApprovalError(undefined)
  }

  return { startSwapFlow, onCancel, confirmModalState, approvalError, pendingModalSteps }
}

export default function ConfirmSwapModal({
  inputAmount,
  allowance,
  onConfirm,
  onSwapToPYUSD,
  onDismiss,
  recipient,
  sendTxHash,
}: {
  inputAmount: CurrencyAmount<Currency>
  allowance: Allowance
  onConfirm: () => void
  onSwapToPYUSD: () => void
  onDismiss: () => void
  fiatValueInput: { data?: number; isLoading: boolean }
  recipient: ResolvedRecipient
  sendTxHash?: string
}) {
  const { startSwapFlow, onCancel, confirmModalState, pendingModalSteps } = useConfirmModalState({
    recipient,
    onSend: onConfirm,
    onSwap: onSwapToPYUSD,
    allowance,
    inputCurrency: inputAmount.currency,
  })

  const onModalDismiss = useCallback(() => {
    onDismiss()
    setTimeout(() => {
      // Reset local state after the modal dismiss animation finishes, to avoid UI flicker as it dismisses
      onCancel()
    }, MODAL_TRANSITION_DURATION)
  }, [onCancel, onDismiss])

  const modalHeader = useCallback(() => {
    if (confirmModalState !== ConfirmModalState.REVIEWING) {
      return null
    }
    return (
      <div style={{ margin: '8px 0' }}>
        <RecipientInput
          type="text"
          value={`${formatCurrencyAmount(inputAmount, 3)} ${inputAmount.currency.symbol} to ${
            recipient.originalRecipient
          }`}
          disabled={true}
        />
      </div>
    )
  }, [confirmModalState, inputAmount, recipient.originalRecipient])

  const modalBottom = useCallback(() => {
    if (confirmModalState === ConfirmModalState.REVIEWING) {
      return (
        <div style={{ marginTop: '12px' }}>
          <ButtonError onClick={startSwapFlow}>
            <Text fontSize={20}>
              <Trans>Confirm</Trans>
            </Text>
          </ButtonError>
        </div>
      )
    }
    return (
      <PendingModalContent
        inputAmount={inputAmount}
        hideStepIndicators={pendingModalSteps.length === 1}
        steps={pendingModalSteps}
        currentStep={confirmModalState}
        tokenApprovalPending={allowance.state === AllowanceState.REQUIRED && allowance.isApprovalPending}
        revocationPending={allowance.state === AllowanceState.REQUIRED && allowance.isRevocationPending}
        onRetryUniswapXSignature={onConfirm}
        sendTxHash={sendTxHash}
        // todo: pipe in the status of the swap to PYUSD (the send flow will only ever need one swap, to PYUSD, before sending to venmo)
        swapResult={undefined}
      />
    )
  }, [inputAmount, confirmModalState, pendingModalSteps, allowance, onConfirm, startSwapFlow, sendTxHash])

  return (
    <Modal isOpen $scrollOverlay onDismiss={onModalDismiss} maxHeight={90}>
      <ConfirmationModalContent
        title={confirmModalState === ConfirmModalState.REVIEWING ? <Trans>Review send</Trans> : undefined}
        onDismiss={onModalDismiss}
        topContent={modalHeader}
        bottomContent={modalBottom}
      />
    </Modal>
  )
}
