import { TradingApi } from '@universe/api'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'
import { ArrowDownToLine } from 'ui/src/components/icons/ArrowDownToLine'
import { ArrowUpToLine } from 'ui/src/components/icons/ArrowUpToLine'
import {
  getEarnPlanStepTitle,
  isEarnPlanStepType,
  type EarnPlanStepType,
} from 'uniswap/src/components/ConfirmSwapModal/steps/EarnPlanStepRowStatus'
import { StepRowProps, StepRowSkeleton } from 'uniswap/src/components/ConfirmSwapModal/steps/StepRowSkeleton'
import type { SwapSteps } from 'uniswap/src/components/ConfirmSwapModal/steps/SwapTXPlanStepRow'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import type { TransactionStep } from 'uniswap/src/features/transactions/steps/types'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'

export type EarnPlanStep = SwapSteps & TradingApi.PlanStep & { stepType: EarnPlanStepType }

export function isEarnPlanStep(step: TransactionStep): step is EarnPlanStep {
  const planStep = step as Partial<TradingApi.PlanStep>
  return isEarnPlanStepType(planStep.stepType)
}

const EarnIcon = ({ stepType }: { stepType: EarnPlanStepType }): JSX.Element => {
  const Icon = stepType === TradingApi.PlanStepType.VAULT_WITHDRAW ? ArrowUpToLine : ArrowDownToLine

  return (
    <Flex centered width="$spacing24" height="$spacing24" borderRadius="$roundedFull" backgroundColor="$accent1">
      <Icon color="$white" size="$icon.12" />
    </Flex>
  )
}

export function EarnPlanStepRow({
  step,
  status,
  currentStepIndex,
  totalStepsCount,
}: StepRowProps<EarnPlanStep>): JSX.Element {
  const { t } = useTranslation()

  const chainId = toSupportedChainId(
    step.stepType === TradingApi.PlanStepType.VAULT_DEPOSIT ? step.tokenInChainId : step.tokenOutChainId,
  )
  const tokenAddress = step.stepType === TradingApi.PlanStepType.VAULT_DEPOSIT ? step.tokenIn : step.tokenOut
  const currencyInfo = useCurrencyInfo(chainId ? buildCurrencyId(chainId, tokenAddress ?? '') : undefined)

  const title = useMemo(
    () => getEarnPlanStepTitle({ status, stepType: step.stepType, symbol: currencyInfo?.currency.symbol, t }),
    [status, step.stepType, currencyInfo?.currency.symbol, t],
  )

  return (
    <StepRowSkeleton
      title={title}
      icon={<EarnIcon stepType={step.stepType} />}
      status={status}
      currentStepIndex={currentStepIndex}
      totalStepsCount={totalStepsCount}
    />
  )
}
