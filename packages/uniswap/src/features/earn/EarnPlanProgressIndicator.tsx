import { TradingApi } from '@universe/api'
import { useMemo } from 'react'
import type { AppTFunction } from 'ui/src/i18n/types'
import { ProgressIndicator } from 'uniswap/src/components/ConfirmSwapModal/ProgressIndicator'
import { isEarnPlanStepType } from 'uniswap/src/components/ConfirmSwapModal/steps/EarnPlanStepRowStatus'
import { TransactionStepType, type TransactionStep } from 'uniswap/src/features/transactions/steps/types'
import { isPlanBackgrounded } from 'uniswap/src/features/transactions/swap/plan/planSagaUtils'
import type { TransactionAndPlanStep } from 'uniswap/src/features/transactions/swap/plan/planStepTransformer'
import {
  activePlanStore,
  type ActivePlanData,
} from 'uniswap/src/features/transactions/swap/review/stores/activePlan/activePlanStore'
import { useStore } from 'zustand'

export interface EarnPlanProgressState {
  steps: TransactionAndPlanStep[]
  /** Array index of currentStep.step within steps (the errored previous step while it is displayed). */
  currentStepIndex: number
  currentStep: { step: TransactionStep; accepted: boolean }
}

export function isEarnPlanPriceChangeInterrupted({
  activePlan,
  priceChangeInterruptedPlanIds,
}: {
  activePlan: ActivePlanData | undefined
  priceChangeInterruptedPlanIds: Set<string>
}): boolean {
  return !!activePlan?.planId && priceChangeInterruptedPlanIds.has(activePlan.planId)
}

export function isEarnActivePlanExecuting({
  activePlan,
  priceChangeInterruptedPlanIds,
}: {
  activePlan: ActivePlanData | undefined
  priceChangeInterruptedPlanIds: Set<string>
}): boolean {
  return !!activePlan && !isEarnPlanPriceChangeInterrupted({ activePlan, priceChangeInterruptedPlanIds })
}

/** In-flight step label for the Earn review CTA area while a plan executes (shared by deposit/withdraw). */
export function getEarnStepProgressLabel({
  activePlan,
  t,
  vaultStepType,
  vaultStepLabel,
}: {
  activePlan: ActivePlanData | undefined
  t: AppTFunction
  vaultStepType: TradingApi.PlanStepType.VAULT_DEPOSIT | TradingApi.PlanStepType.VAULT_WITHDRAW
  vaultStepLabel: string
}): string | undefined {
  if (!activePlan || isPlanBackgrounded(activePlan.planId)) {
    return undefined
  }
  const currentStep = activePlan.steps.at(activePlan.currentStepIndex)
  if (!currentStep) {
    return undefined
  }
  switch (currentStep.type) {
    case TransactionStepType.TokenApprovalTransaction:
    case TransactionStepType.TokenRevocationTransaction:
      return t('transaction.status.approve.pending')
    case TransactionStepType.SwapTransaction:
    case TransactionStepType.SwapTransactionWalletCall:
      return currentStep.stepType === vaultStepType ? vaultStepLabel : t('transaction.status.confirm.pending')
    default:
      return t('transaction.status.confirm.pending')
  }
}

export function useEarnPlanProgressState(): EarnPlanProgressState | undefined {
  const activePlan = useStore(activePlanStore, (state) => state.activePlan)
  const priceChangeInterruptedPlanIds = useStore(activePlanStore, (state) => state.priceChangeInterruptedPlanIds)

  return useMemo(() => {
    if (
      !activePlan ||
      isPlanBackgrounded(activePlan.planId) ||
      isEarnPlanPriceChangeInterrupted({ activePlan, priceChangeInterruptedPlanIds }) ||
      activePlan.steps.length === 0
    ) {
      return undefined
    }

    const hasEarnPlanStep = activePlan.steps.some((step) =>
      isEarnPlanStepType((step as Partial<TradingApi.PlanStep>).stepType),
    )
    if (!hasEarnPlanStep) {
      return undefined
    }

    const currentStep = activePlan.steps.at(activePlan.currentStepIndex)
    const previousStep =
      activePlan.currentStepIndex > 0 ? activePlan.steps.at(activePlan.currentStepIndex - 1) : undefined
    const showErroredPreviousStep = previousStep?.status === TradingApi.PlanStepStatus.STEP_ERROR
    const displayStep = showErroredPreviousStep ? previousStep : currentStep
    if (!displayStep) {
      return undefined
    }

    return {
      steps: activePlan.steps,
      currentStepIndex: showErroredPreviousStep ? activePlan.currentStepIndex - 1 : activePlan.currentStepIndex,
      currentStep: {
        step: displayStep,
        accepted: displayStep.status === TradingApi.PlanStepStatus.STEP_ERROR ? false : activePlan.proofPending,
      },
    }
  }, [activePlan, priceChangeInterruptedPlanIds])
}

export function EarnPlanProgressIndicator({ progress }: { progress: EarnPlanProgressState }): JSX.Element {
  return <ProgressIndicator isChainedAction steps={progress.steps} currentStep={progress.currentStep} />
}
