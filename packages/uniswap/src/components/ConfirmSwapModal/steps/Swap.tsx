import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'
import { Swap } from 'ui/src/components/icons/Swap'
import { StepRowProps, StepRowSkeleton } from 'uniswap/src/components/ConfirmSwapModal/steps/StepRowSkeleton'
import { StepStatus } from 'uniswap/src/components/ConfirmSwapModal/types'
import { useSecondsUntilDeadline } from 'uniswap/src/components/ConfirmSwapModal/useSecondsUntilDeadline'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import {
  UniswapXPlanSignatureStep,
  UniswapXSignatureStep,
} from 'uniswap/src/features/transactions/swap/steps/signOrder'
import {
  SwapTransactionStep,
  SwapTransactionStepAsync,
  SwapTransactionStepBatched,
} from 'uniswap/src/features/transactions/swap/steps/swap'

const SwapIcon = (): JSX.Element => (
  <Flex centered width="$spacing24" height="$spacing24" borderRadius="$roundedFull" backgroundColor="$DEP_blue400">
    <Swap color="$white" size="$icon.12" />
  </Flex>
)

type SwapSteps =
  | SwapTransactionStep
  | SwapTransactionStepAsync
  | UniswapXSignatureStep
  | UniswapXPlanSignatureStep
  | SwapTransactionStepBatched

/**
 * UI component used to display a swap transaction step in the Swap Confirmation Modal
 */
export function SwapTransactionStepRow({
  step,
  status,
  currentStepIndex,
  totalStepsCount,
}: StepRowProps<SwapSteps>): JSX.Element {
  const { t } = useTranslation()

  const deadline =
    step.type === TransactionStepType.UniswapXSignature || step.type === TransactionStepType.UniswapXPlanSignature
      ? step.deadline
      : undefined

  const { secondsRemaining, ranOutOfTimeTitle } = useSecondsUntilDeadline(deadline, status)

  const title =
    ranOutOfTimeTitle ??
    {
      [StepStatus.Preview]: t('swap.confirmSwap'),
      [StepStatus.Active]: t('common.confirmSwap'),
      [StepStatus.InProgress]: t('common.swapPending'),
      [StepStatus.Complete]: t('swap.confirmSwap'),
    }[status]

  return (
    <StepRowSkeleton
      title={title}
      icon={<SwapIcon />}
      learnMore={{
        url:
          step.type === TransactionStepType.SwapTransactionBatched
            ? uniswapUrls.helpArticleUrls.batchedSwaps
            : uniswapUrls.helpArticleUrls.howToSwapTokens,
        text: t('common.learnMoreSwap'),
      }}
      status={status}
      secondsRemaining={secondsRemaining}
      currentStepIndex={currentStepIndex}
      totalStepsCount={totalStepsCount}
    />
  )
}
