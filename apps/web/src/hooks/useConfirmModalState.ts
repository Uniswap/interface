import { InterfaceEventName } from '@uniswap/analytics-events'
import { Currency, Percent } from '@taraswap/sdk-core'
import { ConfirmModalState } from 'components/ConfirmSwapModal'
import { PendingModalError } from 'components/ConfirmSwapModal/Error'
import { Field, RESET_APPROVAL_TOKENS } from 'components/swap/constants'
import { useAccount } from 'hooks/useAccount'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import { getPriceUpdateBasisPoints } from 'lib/utils/analytics'
import { useCallback, useEffect, useState } from 'react'
import { InterfaceTrade } from 'state/routing/types'
import { isUniswapXTrade } from 'state/routing/utils'
import { useIsTransactionConfirmed } from 'state/transactions/hooks'
import invariant from 'tiny-invariant'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { logger } from 'utilities/src/logger/logger'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { NumberType, useFormatter } from 'utils/formatNumbers'
import { didUserReject } from 'utils/swapErrorToUserReadableMessage'
import { tradeMeaningfullyDiffers } from 'utils/tradeMeaningFullyDiffer'
import { useMaxAmountIn } from './useMaxAmountIn'
import { Allowance, AllowanceState } from './usePermit2Allowance'
import usePrevious from './usePrevious'
import useWrapCallback from './useWrapCallback'

type PendingConfirmModalState = Extract<
  ConfirmModalState,
  | ConfirmModalState.APPROVING_TOKEN
  | ConfirmModalState.PERMITTING
  | ConfirmModalState.PENDING_CONFIRMATION
  | ConfirmModalState.WRAPPING
  | ConfirmModalState.RESETTING_TOKEN_ALLOWANCE
>

export function useConfirmModalState({
  trade,
  originalTrade,
  allowedSlippage,
  onSwap,
  allowance,
  onCurrencySelection,
}: {
  trade: InterfaceTrade
  originalTrade?: InterfaceTrade
  allowedSlippage: Percent
  onSwap: () => void
  allowance: Allowance
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
    if (isUniswapXTrade(trade) && trade.wrapInfo.needsWrap) {
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

  const { chainId } = useAccount()
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
    if (didUserReject(e)) {
      return
    }
    logger.warn('useConfirmModalState', 'catchUserReject', 'Failed to wrap', { error: e, trade })
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

  function isInApprovalPhase(confirmModalState: ConfirmModalState) {
    return (
      confirmModalState === ConfirmModalState.RESETTING_TOKEN_ALLOWANCE ||
      confirmModalState === ConfirmModalState.APPROVING_TOKEN ||
      confirmModalState === ConfirmModalState.PERMITTING
    )
  }

  const doesTradeDiffer = originalTrade && tradeMeaningfullyDiffers(trade, originalTrade, allowedSlippage)
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

  const resetToReviewScreen = () => {
    setConfirmModalState(ConfirmModalState.REVIEWING)
  }

  const onCancel = () => {
    setConfirmModalState(ConfirmModalState.REVIEWING)
    setApprovalError(undefined)
  }

  const [lastExecutionPrice, setLastExecutionPrice] = useState(trade?.executionPrice)
  const [priceUpdate, setPriceUpdate] = useState<number>()
  useEffect(() => {
    if (lastExecutionPrice && !trade.executionPrice.equalTo(lastExecutionPrice)) {
      setPriceUpdate(getPriceUpdateBasisPoints(lastExecutionPrice, trade.executionPrice))
      setLastExecutionPrice(trade.executionPrice)
    }
  }, [lastExecutionPrice, setLastExecutionPrice, trade])

  return {
    startSwapFlow,
    resetToReviewScreen,
    onCancel,
    confirmModalState,
    doesTradeDiffer,
    approvalError,
    pendingModalSteps,
    priceUpdate,
    wrapTxHash,
  }
}
