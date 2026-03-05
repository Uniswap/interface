import { type Currency, type CurrencyAmount } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import type { TFunction } from 'i18next'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { ParsedWarnings, Warning } from 'uniswap/src/components/modals/WarningModal/types'
import { WarningAction, WarningLabel, WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { useActiveAddress } from 'uniswap/src/features/accounts/store/hooks'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { hasSufficientFundsIncludingGas } from 'uniswap/src/features/gas/utils'
import { useOnChainCurrencyBalance, useOnChainNativeCurrencyBalance } from 'uniswap/src/features/portfolio/api'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { useFormattedWarnings } from 'uniswap/src/features/transactions/hooks/useParsedTransactionWarnings'
import type { TransactionAndPlanStep } from 'uniswap/src/features/transactions/swap/plan/planStepTransformer'
import { activePlanStore } from 'uniswap/src/features/transactions/swap/review/stores/activePlan/activePlanStore'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { tradingApiToUniverseChainId } from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { isWebPlatform } from 'utilities/src/platform'
import { useStore } from 'zustand'

const APPROVAL_STEP_TYPES = new Set<TradingApi.PlanStepType>([
  TradingApi.PlanStepType.APPROVAL_TXN,
  TradingApi.PlanStepType.APPROVAL_PERMIT,
  TradingApi.PlanStepType.RESET_APPROVAL_TXN,
])

const REMAINING_STATUSES = new Set<TradingApi.PlanStepStatus>([
  TradingApi.PlanStepStatus.NOT_READY,
  TradingApi.PlanStepStatus.AWAITING_ACTION,
])

function stepNeedsGas(step: TransactionAndPlanStep): boolean {
  return step.method === TradingApi.PlanStepMethod.SEND_TX || step.method === TradingApi.PlanStepMethod.SEND_CALLS
}

function isBalanceConsumingStep(step: TransactionAndPlanStep): boolean {
  const isApproval = step.stepType ? APPROVAL_STEP_TYPES.has(step.stepType) : false
  return stepNeedsGas(step) && !isApproval
}

/** Sum gas fees across all gas-needing remaining steps as a raw Wei string. */
function sumGasFees(steps: TransactionAndPlanStep[]): string {
  let total = BigInt(0)
  for (const step of steps) {
    if (stepNeedsGas(step) && step.gasFee) {
      total += BigInt(step.gasFee)
    }
  }
  return total.toString()
}

function getBalanceWarning({
  balanceConsumingStep,
  currency,
  tokenInBalance,
  t,
}: {
  balanceConsumingStep: TransactionAndPlanStep
  currency: Currency
  tokenInBalance: CurrencyAmount<Currency>
  t: TFunction
}): Warning | undefined {
  const { tokenInAmount, tokenInChainId: tokenInChainIdTradingApi } = balanceConsumingStep
  const tokenInChainId = tradingApiToUniverseChainId(tokenInChainIdTradingApi)
  if (!tokenInAmount || !tokenInChainId) {
    return undefined
  }

  const requiredAmount = getCurrencyAmount({
    value: tokenInAmount,
    valueType: ValueType.Raw,
    currency,
  })
  if (!requiredAmount || !tokenInBalance.lessThan(requiredAmount)) {
    return undefined
  }

  const currencySymbol = currency.symbol ?? ''
  const networkName = getChainLabel(tokenInChainId)
  return {
    type: WarningLabel.InsufficientFunds,
    severity: WarningSeverity.Medium,
    action: WarningAction.DisableReview,
    title: t('swap.warning.insufficientBalance.title.activePlan', { currencySymbol, networkName }),
    buttonText: isWebPlatform
      ? t('common.insufficientTokenBalance.error.simple', { tokenSymbol: currencySymbol })
      : undefined,
    currency,
  }
}

function getGasWarning({
  totalGasFee,
  balanceConsumingStep,
  currency,
  nativeBalance,
  t,
}: {
  totalGasFee: string
  balanceConsumingStep: TransactionAndPlanStep | undefined
  currency: Currency | undefined
  nativeBalance: CurrencyAmount<Currency>
  t: TFunction
}): Warning | undefined {
  if (totalGasFee === '0') {
    return undefined
  }

  // If the balance-consuming step spends native currency, include that in the total native spend
  const nativeAmountIn =
    currency?.isNative && balanceConsumingStep?.tokenInAmount
      ? getCurrencyAmount({ value: balanceConsumingStep.tokenInAmount, valueType: ValueType.Raw, currency })
      : undefined

  const hasGasFunds = hasSufficientFundsIncludingGas({
    transactionAmount: nativeAmountIn ?? undefined,
    gasFee: totalGasFee,
    nativeCurrencyBalance: nativeBalance,
  })

  if (hasGasFunds) {
    return undefined
  }

  const currencySymbol = nativeBalance.currency.symbol ?? ''
  return {
    type: WarningLabel.InsufficientGasFunds,
    severity: WarningSeverity.Medium,
    action: WarningAction.DisableSubmit,
    title: t('swap.warning.insufficientGas.title', { currencySymbol }),
    buttonText: isWebPlatform ? t('swap.warning.insufficientGas.button', { currencySymbol }) : undefined,
    message: undefined,
    currency: nativeBalance.currency,
  }
}

/**
 * Computes swap warnings for all remaining steps on the current step's chain.
 *
 * Instead of only checking the current step, this hook looks ahead at all
 * non-completed (NOT_READY / AWAITING_ACTION) steps that share the current
 * step's chain. Gas fees are summed across those steps, and balance is checked
 * against the single balance-consuming step (swap/bridge).
 */
export function useParsedActivePlanWarnings(): ParsedWarnings {
  const { t } = useTranslation()
  const isSubmitting = useSwapFormStore((s) => s.isSubmitting)

  // Read reference-stable values from the store to avoid infinite re-renders.
  const currentStep = useStore(activePlanStore, (s) => {
    const plan = s.activePlan
    if (!plan) {
      return undefined
    }
    return plan.steps[plan.currentStepIndex]
  })
  const allSteps = useStore(activePlanStore, (s) => s.activePlan?.steps)

  // Filter remaining steps on the current step's chain (NOT_READY / AWAITING_ACTION)
  const remainingStepsOnCurrentChain = useMemo(() => {
    if (!currentStep || !allSteps) {
      return []
    }

    return allSteps.filter((s, index) => {
      const isCurrentOrFollowingStep = index >= currentStep.stepIndex
      const sameChain = s.tokenInChainId === currentStep.tokenInChainId
      const isRemaining = REMAINING_STATUSES.has(s.status)

      return isCurrentOrFollowingStep && sameChain && isRemaining
    })
  }, [allSteps, currentStep])

  // Derive the single balance-consuming step (swap/bridge) and summed gas for the chain
  const balanceConsumingStep = remainingStepsOnCurrentChain.find(isBalanceConsumingStep)
  const totalGasFee = sumGasFees(remainingStepsOnCurrentChain)

  const stepChainId = tradingApiToUniverseChainId(currentStep?.tokenInChainId)

  // Resolve currency from the balance-consuming step's token (not the current step's)
  const currencyId =
    stepChainId !== undefined && balanceConsumingStep?.tokenIn
      ? buildCurrencyId(stepChainId, balanceConsumingStep.tokenIn)
      : undefined

  const currencyInfo = useCurrencyInfo(currencyId)
  const currency = currencyInfo?.currency

  // Hooks must always be called — use Mainnet as a safe fallback when no plan is active.
  const chainIdForHooks = stepChainId ?? UniverseChainId.Mainnet
  const accountAddress = useActiveAddress(chainIdForHooks)

  const { balance: tokenInBalance } = useOnChainCurrencyBalance(currency, accountAddress)
  const { balance: nativeBalance } = useOnChainNativeCurrencyBalance(chainIdForHooks, accountAddress)

  const warnings: Warning[] = useMemo(() => {
    if (!currentStep || remainingStepsOnCurrentChain.length === 0 || isSubmitting) {
      return []
    }

    const result: Warning[] = []

    if (balanceConsumingStep && currency && tokenInBalance) {
      const balanceWarningResult = getBalanceWarning({ balanceConsumingStep, currency, tokenInBalance, t })
      if (balanceWarningResult) {
        result.push(balanceWarningResult)
      }
    }

    if (nativeBalance) {
      const gasWarningResult = getGasWarning({ totalGasFee, balanceConsumingStep, currency, nativeBalance, t })
      if (gasWarningResult) {
        result.push(gasWarningResult)
      }
    }

    return result
  }, [
    currentStep,
    remainingStepsOnCurrentChain,
    balanceConsumingStep,
    currency,
    tokenInBalance,
    nativeBalance,
    totalGasFee,
    isSubmitting,
    t,
  ])

  return useFormattedWarnings(warnings)
}
