import { Trans } from '@lingui/macro'
import {
  InterfaceEventName,
  InterfaceModalName,
  SwapEventName,
  SwapPriceUpdateUserResponse,
} from '@uniswap/analytics-events'
import { Currency, Percent } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { sendAnalyticsEvent, Trace, useTrace } from 'analytics'
import Badge from 'components/Badge'
import Modal, { MODAL_TRANSITION_DURATION } from 'components/Modal'
import { RowFixed } from 'components/Row'
import { getChainInfo } from 'constants/chainInfo'
import { TransactionStatus } from 'graphql/data/__generated__/types-and-hooks'
import { useMaxAmountIn } from 'hooks/useMaxAmountIn'
import { Allowance, AllowanceState } from 'hooks/usePermit2Allowance'
import usePrevious from 'hooks/usePrevious'
import { SwapResult } from 'hooks/useSwapCallback'
import useWrapCallback from 'hooks/useWrapCallback'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import { getPriceUpdateBasisPoints } from 'lib/utils/analytics'
import { useCallback, useEffect, useState } from 'react'
import { InterfaceTrade, TradeFillType } from 'state/routing/types'
import { Field } from 'state/swap/actions'
import { useIsTransactionConfirmed, useSwapTransactionStatus } from 'state/transactions/hooks'
import styled from 'styled-components'
import { ThemedText } from 'theme/components'
import invariant from 'tiny-invariant'
import { isL2ChainId } from 'utils/chains'
import { SignatureExpiredError } from 'utils/errors'
import { NumberType, useFormatter } from 'utils/formatNumbers'
import { formatSwapPriceUpdatedEventProperties } from 'utils/loggingFormatters'
import { didUserReject } from 'utils/swapErrorToUserReadableMessage'
import { tradeMeaningfullyDiffers } from 'utils/tradeMeaningFullyDiffer'

import { ConfirmationModalContent } from '../TransactionConfirmationModal'
import { RESET_APPROVAL_TOKENS } from './constants'
import { PendingConfirmModalState, PendingModalContent } from './PendingModalContent'
import { ErrorModalContent, PendingModalError } from './PendingModalContent/ErrorModalContent'
import SwapModalFooter from './SwapModalFooter'
import SwapModalHeader from './SwapModalHeader'

export enum ConfirmModalState {
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

const StyledL2Logo = styled.img`
  height: 16px;
  width: 16px;
`

function isInApprovalPhase(confirmModalState: ConfirmModalState) {
  return (
    confirmModalState === ConfirmModalState.RESETTING_TOKEN_ALLOWANCE ||
    confirmModalState === ConfirmModalState.APPROVING_TOKEN ||
    confirmModalState === ConfirmModalState.PERMITTING
  )
}

function useConfirmModalState({
  trade,
  allowedSlippage,
  onSwap,
  allowance,
  doesTradeDiffer,
  onCurrencySelection,
}: {
  trade: InterfaceTrade
  allowedSlippage: Percent
  onSwap: () => void
  allowance: Allowance
  doesTradeDiffer: boolean
  onCurrencySelection: (field: Field, currency: Currency) => void
}) {
  const [confirmModalState, setConfirmModalState] = useState<ConfirmModalState>(ConfirmModalState.REVIEWING)
  const [approvalError, setApprovalError] = useState<PendingModalError>()
  const [pendingModalSteps, setPendingModalSteps] = useState<PendingConfirmModalState[]>([])
  const { formatCurrencyAmount } = useFormatter()

  // This is a function instead of a memoized value because we do _not_ want it to update as the allowance changes.
  // For example, if the user needs to complete 3 steps initially, we should always show 3 step indicators
  // at the bottom of the modal, even after they complete steps 1 and 2.
  const generateRequiredSteps = useCallback(() => {
    const steps: PendingConfirmModalState[] = []
    if (trade.fillType === TradeFillType.UniswapX && trade.wrapInfo.needsWrap) {
      steps.push(ConfirmModalState.WRAPPING)
    }
    if (
      allowance.state === AllowanceState.REQUIRED &&
      allowance.needsSetupApproval &&
      RESET_APPROVAL_TOKENS.some((token) => token.equals(allowance.token)) &&
      allowance.allowedAmount.greaterThan(0)
    ) {
      steps.push(ConfirmModalState.RESETTING_TOKEN_ALLOWANCE)
    }
    if (allowance.state === AllowanceState.REQUIRED && allowance.needsSetupApproval) {
      steps.push(ConfirmModalState.APPROVING_TOKEN)
    }
    if (allowance.state === AllowanceState.REQUIRED && allowance.needsPermitSignature) {
      steps.push(ConfirmModalState.PERMITTING)
    }
    steps.push(ConfirmModalState.PENDING_CONFIRMATION)
    return steps
  }, [allowance, trade])

  const { chainId } = useWeb3React()
  const trace = useTrace()
  const maximumAmountIn = useMaxAmountIn(trade, allowedSlippage)

  const nativeCurrency = useNativeCurrency(chainId)

  const [wrapTxHash, setWrapTxHash] = useState<string>()
  const { execute: onWrap } = useWrapCallback(
    nativeCurrency,
    trade.inputAmount.currency,
    formatCurrencyAmount({
      amount: trade.inputAmount,
      type: NumberType.SwapTradeAmount,
    })
  )
  const wrapConfirmed = useIsTransactionConfirmed(wrapTxHash)
  const prevWrapConfirmed = usePrevious(wrapConfirmed)
  const catchUserReject = async (e: any, errorType: PendingModalError) => {
    setConfirmModalState(ConfirmModalState.REVIEWING)
    if (didUserReject(e)) return
    console.error(e)
    setApprovalError(errorType)
  }

  const performStep = useCallback(
    async (step: ConfirmModalState) => {
      switch (step) {
        case ConfirmModalState.WRAPPING:
          setConfirmModalState(ConfirmModalState.WRAPPING)
          onWrap?.()
            .then((wrapTxHash) => {
              setWrapTxHash(wrapTxHash)
              // After the wrap has succeeded, reset the input currency to be WETH
              // because the trade will be on WETH -> token
              onCurrencySelection(Field.INPUT, trade.inputAmount.currency)
              sendAnalyticsEvent(InterfaceEventName.WRAP_TOKEN_TXN_SUBMITTED, {
                chain_id: chainId,
                token_symbol: maximumAmountIn?.currency.symbol,
                token_address: maximumAmountIn?.currency.address,
                ...trade,
                ...trace,
              })
            })
            .catch((e) => catchUserReject(e, PendingModalError.WRAP_ERROR))
          break
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
        case ConfirmModalState.PENDING_CONFIRMATION:
          setConfirmModalState(ConfirmModalState.PENDING_CONFIRMATION)
          try {
            onSwap()
          } catch (e) {
            catchUserReject(e, PendingModalError.CONFIRMATION_ERROR)
          }
          break
        default:
          setConfirmModalState(ConfirmModalState.REVIEWING)
          break
      }
    },
    [
      allowance,
      chainId,
      maximumAmountIn?.currency.address,
      maximumAmountIn?.currency.symbol,
      onSwap,
      onWrap,
      trace,
      trade,
      onCurrencySelection,
    ]
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
    // If the wrapping step finished, trigger the next step (allowance or swap).
    if (wrapConfirmed && !prevWrapConfirmed) {
      // moves on to either approve WETH or to swap submission
      performStep(pendingModalSteps[1])
    }
  }, [pendingModalSteps, performStep, prevWrapConfirmed, wrapConfirmed])

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
      // Caveat: prevents swap if trade has updated mid approval flow.
      if (doesTradeDiffer) {
        setConfirmModalState(ConfirmModalState.REVIEWING)
        return
      }
      performStep(ConfirmModalState.PENDING_CONFIRMATION)
    }
  }, [allowance, confirmModalState, doesTradeDiffer, performStep])

  const onCancel = () => {
    setConfirmModalState(ConfirmModalState.REVIEWING)
    setApprovalError(undefined)
  }

  return { startSwapFlow, onCancel, confirmModalState, approvalError, pendingModalSteps, wrapTxHash }
}

export default function ConfirmSwapModal({
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
          disabledConfirm={showAcceptChanges}
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
            <StyledL2Logo src={info.logoUrl} />
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
