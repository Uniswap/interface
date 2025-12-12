import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Separator, Text } from 'ui/src'
import { zIndexes } from 'ui/src/theme'
import {
  TokenApprovalTransactionStepRow,
  TokenRevocationTransactionStepRow,
} from 'uniswap/src/components/ConfirmSwapModal/steps/Approve'
import { LPTransactionStepRow } from 'uniswap/src/components/ConfirmSwapModal/steps/LP'
import {
  Permit2SignatureStepRow,
  Permit2TransactionStepRow,
} from 'uniswap/src/components/ConfirmSwapModal/steps/Permit'
import { SwapTransactionStepRow } from 'uniswap/src/components/ConfirmSwapModal/steps/Swap'
import { SwapSteps, SwapTransactionPlanStepRow } from 'uniswap/src/components/ConfirmSwapModal/steps/SwapTXPlanStepRow'
import { WrapTransactionStepRow } from 'uniswap/src/components/ConfirmSwapModal/steps/Wrap'
import { StepStatus } from 'uniswap/src/components/ConfirmSwapModal/types'
import { TransactionStep, TransactionStepType } from 'uniswap/src/features/transactions/steps/types'

interface ProgressIndicatorProps {
  steps: TransactionStep[]
  currentStep?: { step: TransactionStep; accepted: boolean }
  isChainedAction?: boolean
}

function areStepsEqual(
  currentStep: TransactionStep | undefined,
  isChainedAction: boolean,
): (step: TransactionStep) => boolean {
  return (step: TransactionStep) => {
    if (step.type !== currentStep?.type) {
      return false
    }

    if (
      isChainedAction &&
      'stepIndex' in step &&
      'stepIndex' in currentStep &&
      step.stepIndex !== currentStep.stepIndex
    ) {
      return false
    }

    // There can be multiple approval steps with different tokens so both the type and the approval has to match
    if (currentStep.type === TransactionStepType.TokenApprovalTransaction) {
      return (
        step.type === TransactionStepType.TokenApprovalTransaction && step.tokenAddress === currentStep.tokenAddress
      )
    }

    return true
  }
}

export function ProgressIndicator({
  currentStep,
  steps,
  isChainedAction = false,
}: ProgressIndicatorProps): JSX.Element | null {
  const { t } = useTranslation()
  function getStatus(targetStep: TransactionStep): StepStatus {
    const currentIndex = steps.findIndex(areStepsEqual(currentStep?.step, isChainedAction))
    const targetIndex = steps.indexOf(targetStep)
    if (currentIndex < targetIndex) {
      return StepStatus.Preview
    } else if (currentIndex === targetIndex) {
      return currentStep?.accepted ? StepStatus.InProgress : StepStatus.Active
    } else {
      return StepStatus.Complete
    }
  }

  const counts = useMemo(() => {
    return steps.reduce(
      (acc, step) => {
        acc[step.type] = (acc[step.type] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )
  }, [steps])

  const typeIndices = useMemo(() => {
    const indices: Record<string, number> = {}
    return steps.map((step) => {
      const currentIndex = indices[step.type] ?? 0
      indices[step.type] = currentIndex + 1
      return currentIndex
    })
  }, [steps])

  if (steps.length === 0) {
    return null
  }

  return (
    <Flex enterStyle={{ opacity: 0 }} animation="quicker" gap="$spacing16">
      <Flex row gap="$spacing12" alignItems="center">
        <Separator my="$spacing12" />
        <Text color="$neutral2" variant="body3">
          {t('swap.review.continueInWallet')}
        </Text>
        <Separator my="$spacing12" />
      </Flex>
      <Flex pr="$spacing8">
        {steps.map((step, i) => {
          const stepStatus = getStatus(step)
          const isNotLastStep = i < steps.length - 1

          return (
            <Flex key={`progress-indicator-step-${i}`}>
              <Step
                isPlanStep={isChainedAction}
                step={step}
                status={stepStatus}
                currentIndexOfStepType={typeIndices[i] as number}
                totalCountOfStepType={counts[step.type]}
                currentStepIndex={i}
                totalStepsCount={steps.length}
              />
              {isNotLastStep && (
                <Flex
                  position="absolute"
                  top="50%"
                  borderLeftWidth={2}
                  borderColor="transparent"
                  borderLeftColor="$neutral3"
                  transform="translate(0, 100%)"
                  borderStyle="dotted"
                  height="33%"
                  zIndex={zIndexes.negative}
                  // accounts for the border width's width
                  mx={19}
                  width={0}
                />
              )}
            </Flex>
          )
        })}
      </Flex>
    </Flex>
  )
}

function Step({
  step,
  status,
  isPlanStep,
  currentIndexOfStepType,
  totalCountOfStepType,
  currentStepIndex,
  totalStepsCount,
}: {
  step: TransactionStep
  status: StepStatus
  isPlanStep: boolean
  currentIndexOfStepType: number
  totalCountOfStepType?: number
  currentStepIndex: number
  totalStepsCount: number
}): JSX.Element {
  const commonProps = {
    status,
    currentStepIndex,
    totalStepsCount,
  }
  switch (step.type) {
    case TransactionStepType.WrapTransaction:
      return <WrapTransactionStepRow step={step} {...commonProps} />
    case TransactionStepType.TokenApprovalTransaction:
      return <TokenApprovalTransactionStepRow step={step} {...commonProps} />
    case TransactionStepType.TokenRevocationTransaction:
      return <TokenRevocationTransactionStepRow step={step} {...commonProps} />
    case TransactionStepType.Permit2Signature:
      return <Permit2SignatureStepRow step={step} {...commonProps} />
    case TransactionStepType.Permit2Transaction:
      return (
        <Permit2TransactionStepRow
          step={step}
          currentIndexOfStepType={currentIndexOfStepType}
          totalCountOfStepType={totalCountOfStepType}
          {...commonProps}
        />
      )
    // TODO SWAP-433: Add support for TransactionStepType.SwapTransactionBatched
    case TransactionStepType.SwapTransaction:
    case TransactionStepType.SwapTransactionAsync:
    case TransactionStepType.UniswapXSignature:
    case TransactionStepType.UniswapXPlanSignature:
      if (isPlanStep) {
        return <SwapTransactionPlanStepRow step={step as SwapSteps} {...commonProps} />
      }
      return <SwapTransactionStepRow step={step} {...commonProps} />
    case TransactionStepType.IncreasePositionTransaction:
    case TransactionStepType.IncreasePositionTransactionAsync:
    case TransactionStepType.DecreasePositionTransaction:
      return <LPTransactionStepRow step={step} {...commonProps} />
    case TransactionStepType.MigratePositionTransaction:
    case TransactionStepType.MigratePositionTransactionAsync:
    case TransactionStepType.CollectFeesTransactionStep:
      return <LPTransactionStepRow step={step} {...commonProps} />
    default:
      // Return a fallback UI if no matching case is found
      return <></>
  }
}
