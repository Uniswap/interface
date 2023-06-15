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
import Badge from 'components/Badge'
import Modal, { MODAL_TRANSITION_DURATION } from 'components/Modal'
import { RowFixed } from 'components/Row'
import { getChainInfo } from 'constants/chainInfo'
import { useMaxAmountIn } from 'hooks/useMaxAmountIn'
import { Allowance, AllowanceState } from 'hooks/usePermit2Allowance'
import usePrevious from 'hooks/usePrevious'
import { getPriceUpdateBasisPoints } from 'lib/utils/analytics'
import { useCallback, useEffect, useState } from 'react'
import { InterfaceTrade } from 'state/routing/types'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'
import { isL2ChainId } from 'utils/chains'
import { formatSwapPriceUpdatedEventProperties } from 'utils/loggingFormatters'
import { didUserReject } from 'utils/swapErrorToUserReadableMessage'
import { tradeMeaningfullyDiffers } from 'utils/tradeMeaningFullyDiffer'

import { ConfirmationModalContent } from '../TransactionConfirmationModal'
import { PendingConfirmModalState, PendingModalContent } from './PendingModalContent'
import { ErrorModalContent, PendingModalError } from './PendingModalContent/ErrorModalContent'
import SwapModalFooter from './SwapModalFooter'
import SwapModalHeader from './SwapModalHeader'

export enum ConfirmModalState {
  REVIEWING,
  APPROVING_TOKEN,
  PERMITTING,
  PENDING_CONFIRMATION,
}

const StyledL2Badge = styled(Badge)`
  padding: 6px 8px;
`

const StyledL2Logo = styled.img`
  height: 16px;
  width: 16px;
`

function isInApprovalPhase(confirmModalState: ConfirmModalState) {
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

  // This is a function instead of a memoized value because we do _not_ want it to update as the allowance changes.
  // For example, if the user needs to complete 3 steps initially, we should always show 3 step indicators
  // at the bottom of the modal, even after they complete steps 1 and 2.
  const prepareSwapFlow = useCallback(() => {
    const steps: PendingConfirmModalState[] = []
    if (allowance.state === AllowanceState.REQUIRED && allowance.needsSetupApproval) {
      steps.push(ConfirmModalState.APPROVING_TOKEN)
    }
    if (allowance.state === AllowanceState.REQUIRED && allowance.needsPermitSignature) {
      steps.push(ConfirmModalState.PERMITTING)
    }
    steps.push(ConfirmModalState.PENDING_CONFIRMATION)
    setPendingModalSteps(steps)
  }, [allowance])

  const { chainId } = useWeb3React()
  const trace = useTrace()
  const maximumAmountIn = useMaxAmountIn(trade, allowedSlippage)

  const startSwapFlow = useCallback(async () => {
    setApprovalError(undefined)
    if (allowance.state === AllowanceState.REQUIRED) {
      // Starts the approval process, by triggering either the Token Approval or the Permit signature.
      try {
        if (allowance.needsSetupApproval) {
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
          allowance.needsSetupApproval ? PendingModalError.TOKEN_APPROVAL_ERROR : PendingModalError.PERMIT_ERROR
        )
      }
    } else {
      setConfirmModalState(ConfirmModalState.PENDING_CONFIRMATION)
      onSwap()
    }
  }, [allowance, chainId, maximumAmountIn?.currency.address, maximumAmountIn?.currency.symbol, onSwap, trace])

  const previousPermitNeeded = usePrevious(
    allowance.state === AllowanceState.REQUIRED ? allowance.needsSetupApproval : undefined
  )
  useEffect(() => {
    if (
      allowance.state === AllowanceState.REQUIRED &&
      allowance.needsPermitSignature &&
      // If the token approval switched from missing to fulfilled, trigger the next step (permit2 signature).
      !allowance.needsSetupApproval &&
      previousPermitNeeded
    ) {
      startSwapFlow()
    }
  }, [allowance, previousPermitNeeded, startSwapFlow])

  useEffect(() => {
    // Automatically triggers the next phase if the local modal state still thinks we're in the approval phase,
    // but the allowance has been set. This will automaticaly trigger the swap.
    if (isInApprovalPhase(confirmModalState) && allowance.state === AllowanceState.ALLOWED) {
      // Caveat: prevents swap if trade has updated mid approval flow.
      if (doesTradeDiffer) {
        setConfirmModalState(ConfirmModalState.REVIEWING)
        return
      }
      startSwapFlow()
    }
  }, [allowance, confirmModalState, doesTradeDiffer, startSwapFlow])

  const onCancel = () => {
    setConfirmModalState(ConfirmModalState.REVIEWING)
    setApprovalError(undefined)
  }

  return { startSwapFlow, prepareSwapFlow, onCancel, confirmModalState, approvalError, pendingModalSteps }
}

export default function ConfirmSwapModal({
  trade,
  originalTrade,
  onAcceptChanges,
  allowedSlippage,
  allowance,
  onConfirm,
  onDismiss,
  swapError,
  txHash,
  swapQuoteReceivedDate,
  fiatValueInput,
  fiatValueOutput,
}: {
  trade: InterfaceTrade
  originalTrade?: InterfaceTrade
  txHash?: string
  allowedSlippage: Percent
  allowance: Allowance
  onAcceptChanges: () => void
  onConfirm: () => void
  swapError?: Error
  onDismiss: () => void
  swapQuoteReceivedDate?: Date
  fiatValueInput: { data?: number; isLoading: boolean }
  fiatValueOutput: { data?: number; isLoading: boolean }
}) {
  const { chainId } = useWeb3React()
  const doesTradeDiffer = originalTrade && tradeMeaningfullyDiffers(trade, originalTrade, allowedSlippage)
  const { startSwapFlow, onCancel, confirmModalState, approvalError, pendingModalSteps, prepareSwapFlow } =
    useConfirmModalState({
      trade,
      allowedSlippage,
      onSwap: onConfirm,
      allowance,
      doesTradeDiffer: Boolean(doesTradeDiffer),
    })

  const swapFailed = Boolean(swapError) && !didUserReject(swapError)
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
    return <SwapModalHeader trade={trade} allowedSlippage={allowedSlippage} />
  }, [allowedSlippage, confirmModalState, showAcceptChanges, trade])

  const modalBottom = useCallback(() => {
    if (confirmModalState === ConfirmModalState.REVIEWING || showAcceptChanges) {
      return (
        <SwapModalFooter
          onConfirm={() => {
            // Calculate the necessary steps once, before starting the flow.
            prepareSwapFlow()
            startSwapFlow()
          }}
          trade={trade}
          hash={txHash}
          allowedSlippage={allowedSlippage}
          disabledConfirm={showAcceptChanges}
          swapQuoteReceivedDate={swapQuoteReceivedDate}
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
        swapTxHash={txHash}
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
    swapQuoteReceivedDate,
    fiatValueInput,
    fiatValueOutput,
    onAcceptChanges,
    swapFailed,
    swapError?.message,
    prepareSwapFlow,
    startSwapFlow,
  ])

  const l2Badge = () => {
    if (isL2ChainId(chainId) && confirmModalState !== ConfirmModalState.REVIEWING) {
      const info = getChainInfo(chainId)
      return (
        <StyledL2Badge>
          <RowFixed data-testid="confirmation-modal-chain-icon" gap="sm">
            <StyledL2Logo src={info.logoUrl} />
            <ThemedText.SubHeaderSmall>{info.label}</ThemedText.SubHeaderSmall>
          </RowFixed>
        </StyledL2Badge>
      )
    }
    return undefined
  }

  return (
    <Trace modal={InterfaceModalName.CONFIRM_SWAP}>
      <Modal isOpen $scrollOverlay onDismiss={onModalDismiss} maxHeight={90}>
        {approvalError || swapFailed ? (
          <ErrorModalContent
            errorType={approvalError ?? PendingModalError.CONFIRMATION_ERROR}
            onRetry={startSwapFlow}
          />
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
