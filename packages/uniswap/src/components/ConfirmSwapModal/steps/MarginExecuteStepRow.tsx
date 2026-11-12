import { TradingApi } from '@universe/api'
import { Flex } from '@universe/mycelium'
import type { GeneratedIcon } from '@universe/mycelium/icons'
import { Approve } from '@universe/mycelium/icons/Approve'
import { StepRowProps, StepRowSkeleton } from 'uniswap/src/components/ConfirmSwapModal/steps/StepRowSkeleton'
import type { TransactionStep } from 'uniswap/src/features/transactions/steps/types'
import type { SwapTransactionStep } from 'uniswap/src/features/transactions/swap/steps/swap'

export type MarginExecuteStep = SwapTransactionStep & {
  stepType: TradingApi.PlanStepType.MARGIN_EXECUTE
  marginStepTitle: string
  marginStepIcon?: GeneratedIcon
}

export function isMarginExecuteStep(step: TransactionStep): step is MarginExecuteStep {
  return 'stepType' in step && step.stepType === TradingApi.PlanStepType.MARGIN_EXECUTE && 'marginStepTitle' in step
}

// Sized to match Approve at $icon.24, which draws a 20px circle inside its 24px box.
function MarginStepIconBadge({ Icon }: { Icon: GeneratedIcon }): JSX.Element {
  return (
    <Flex centered width="$spacing24" height="$spacing24">
      <Flex centered width="$spacing20" height="$spacing20" borderRadius="$roundedFull" backgroundColor="$neutral1">
        <Icon color="$surface1" size="$icon.12" />
      </Flex>
    </Flex>
  )
}

export function MarginExecuteStepRow({
  step,
  status,
  currentStepIndex,
  totalStepsCount,
}: StepRowProps<MarginExecuteStep>): JSX.Element {
  return (
    <StepRowSkeleton
      title={step.marginStepTitle}
      icon={
        step.marginStepIcon ? (
          <MarginStepIconBadge Icon={step.marginStepIcon} />
        ) : (
          <Approve color="$neutral2" size="$icon.24" />
        )
      }
      status={status}
      currentStepIndex={currentStepIndex}
      totalStepsCount={totalStepsCount}
    />
  )
}
