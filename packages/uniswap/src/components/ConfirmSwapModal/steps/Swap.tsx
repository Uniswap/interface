import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, useSporeColors } from 'ui/src'
import { Swap } from 'ui/src/components/icons/Swap'
import { StepRowProps, StepRowSkeleton } from 'uniswap/src/components/ConfirmSwapModal/steps/StepRowSkeleton'
import { StepStatus } from 'uniswap/src/components/ConfirmSwapModal/types'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import {
  SwapTransactionStep,
  SwapTransactionStepAsync,
  TransactionStepType,
  UniswapXSignatureStep,
} from 'uniswap/src/features/transactions/swap/types/steps'
import noop from 'utilities/src/react/noop'

const SwapIcon = (): JSX.Element => (
  <Flex centered width="$spacing24" height="$spacing24" borderRadius="$roundedFull" backgroundColor="$DEP_blue400">
    <Swap color="$white" size="$icon.12" />
  </Flex>
)

type SwapSteps = SwapTransactionStep | SwapTransactionStepAsync | UniswapXSignatureStep
export function SwapTransactionStepRow({ step, status }: StepRowProps<SwapSteps>): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()

  const deadline = step.type === TransactionStepType.UniswapXSignature ? step.deadline : undefined
  const secondsRemaining = useSecondsUntilDeadline(deadline, status)

  const active = status === StepStatus.Active
  const ranOutOfTimeTitle = active && deadline && !secondsRemaining ? t('common.confirmTimedOut') : undefined

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
        url: uniswapUrls.helpArticleUrls.howToSwapTokens,
        text: t('common.learnMoreSwap'),
      }}
      rippleColor={colors.DEP_blue400.val}
      status={status}
      secondsRemaining={secondsRemaining}
    />
  )
}

function useSecondsUntilDeadline(deadline: number | undefined, status: StepStatus): number | undefined {
  const [secondsRemaining, setSecondsRemaining] = useState<number>()

  useEffect(() => {
    if (!deadline || status !== StepStatus.Active) {
      setSecondsRemaining(undefined)
      return noop
    }

    const secondsUntilDeadline = deadline - Math.floor(Date.now() / 1000)
    if (secondsUntilDeadline <= 0) {
      return noop
    }

    setSecondsRemaining(secondsUntilDeadline)

    const timer = setInterval(() => {
      setSecondsRemaining((prevSecondsRemaining) => {
        if (!prevSecondsRemaining) {
          clearInterval(timer)
          return prevSecondsRemaining
        }

        return prevSecondsRemaining - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [deadline, status])

  return secondsRemaining
}
