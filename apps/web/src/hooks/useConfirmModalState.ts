import { Currency, Percent } from '@uniswap/sdk-core'
import { ConfirmModalState } from 'components/ConfirmSwapModal'
import { PendingModalError } from 'components/ConfirmSwapModal/Error'
import { RESET_APPROVAL_TOKENS } from 'components/swap/constants'
import { useAccount } from 'hooks/useAccount'
import { Allowance, AllowanceState } from 'hooks/usePermit2Allowance'
import usePrevious from 'hooks/usePrevious'
import useSelectChain from 'hooks/useSelectChain'
import useWrapCallback from 'hooks/useWrapCallback'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import { getPriceUpdateBasisPoints } from 'lib/utils/analytics'
import { useCallback, useEffect, useState } from 'react'
import { useMultichainContext } from 'state/multichain/useMultichainContext'
import { InterfaceTrade } from 'state/routing/types'
import { isUniswapXTrade } from 'state/routing/utils'
import { useIsTransactionConfirmed } from 'state/transactions/hooks'
import invariant from 'tiny-invariant'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { CurrencyField } from 'uniswap/src/types/currency'
import { NumberType } from 'utilities/src/format/types'
import { logger } from 'utilities/src/logger/logger'
import { didUserReject } from 'utils/swapErrorToUserReadableMessage'
import { tradeMeaningfullyDiffers } from 'utils/tradeMeaningFullyDiffer'

type PendingConfirmModalState = Extract<
  ConfirmModalState,
  | ConfirmModalState.APPROVING_TOKEN
  | ConfirmModalState.PERMITTING
  | ConfirmModalState.PENDING_CONFIRMATION
  | ConfirmModalState.WRAPPING
  | ConfirmModalState.RESETTING_TOKEN_ALLOWANCE
>

function isInApprovalPhase(confirmModalState: ConfirmModalState) {
  return (
    confirmModalState === ConfirmModalState.RESETTING_TOKEN_ALLOWANCE ||
    confirmModalState === ConfirmModalState.APPROVING_TOKEN ||
    confirmModalState === ConfirmModalState.PERMITTING
  )
}

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
  onCurrencySelection: (field: CurrencyField, currency: Currency, isResettingWETHAfterWrap?: boolean) => void
}) {
  const [confirmModalState, setConfirmModalState] = useState<ConfirmModalState>(ConfirmModalState.REVIEWING)
  const [approvalError, setApprovalError] = useState<PendingModalError>()
  const [pendingModalSteps, setPendingModalSteps] = useState<PendingConfirmModalState[]>([])
  const { formatCurrencyAmount } = useLocalizationContext()

  const account = useAccount()
  const { chainId } = useMultichainContext()

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

  const nativeCurrency = useNativeCurrency(chainId)

  const [wrapTxHash, setWrapTxHash] = useState<string>()
  const { execute: onWrap } = useWrapCallback({
    inputCurrency: nativeCurrency,
    outputCurrency: trade.inputAmount.currency,
    typedValue: formatCurrencyAmount({
      value: trade.inputAmount,
      type: NumberType.SwapTradeAmount,
    }),
  })
  const wrapConfirmed = useIsTransactionConfirmed(wrapTxHash)
  const prevWrapConfirmed = usePrevious(wrapConfirmed)
  const catchUserReject = useCallback(
    async (e: any, errorType: PendingModalError) => {
      setConfirmModalState(ConfirmModalState.REVIEWING)
      if (didUserReject(e)) {
        return
      }
      logger.warn('useConfirmModalState', 'catchUserReject', 'Failed to wrap', { error: e, trade })
      setApprovalError(errorType)
    },
    [trade],
  )

  const selectChain = useSelectChain()
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
              onCurrencySelection(CurrencyField.INPUT, trade.inputAmount.currency, /*isResettingWETHAfterWrap=*/ true)
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
    [onWrap, allowance, onCurrencySelection, trade, catchUserReject, onSwap],
  )

  const startSwapFlow = useCallback(async () => {
    if (chainId && chainId !== account.chainId) {
      const switchChainResult = await selectChain(chainId)
      if (!switchChainResult) {
        return
      }
    }
    const steps = generateRequiredSteps()
    setPendingModalSteps(steps)
    performStep(steps[0])
  }, [account.chainId, chainId, generateRequiredSteps, performStep, selectChain])

  const previousSetupApprovalNeeded = usePrevious(
    allowance.state === AllowanceState.REQUIRED ? allowance.needsSetupApproval : undefined,
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
    allowance.state === AllowanceState.REQUIRED && allowance.isRevocationPending,
  )
  useEffect(() => {
    if (allowance.state === AllowanceState.REQUIRED && previousRevocationPending && !allowance.isRevocationPending) {
      performStep(ConfirmModalState.APPROVING_TOKEN)
    }
  }, [allowance, performStep, previousRevocationPending])

  const doesTradeDiffer =
    originalTrade &&
    tradeMeaningfullyDiffers({
      currentTrade: trade,
      newTrade: originalTrade,
      slippage: allowedSlippage,
    })
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

  const [lastExecutionPrice, setLastExecutionPrice] = useState(trade.executionPrice)
  const [priceUpdate, setPriceUpdate] = useState<number>()
  useEffect(() => {
    if (!trade.executionPrice.equalTo(lastExecutionPrice)) {
      setPriceUpdate(getPriceUpdateBasisPoints(lastExecutionPrice, trade.executionPrice))
      setLastExecutionPrice(trade.executionPrice)
    }
  }, [lastExecutionPrice, trade])

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
