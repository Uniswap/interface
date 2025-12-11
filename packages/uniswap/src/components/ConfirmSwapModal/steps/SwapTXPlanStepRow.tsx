import { TradingApi } from '@universe/api'
import { TFunction } from 'i18next'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSporeColors } from 'ui/src'
import { CrosschainIcon } from 'ui/src/components/icons/CrosschainIcon'
import { iconSizes } from 'ui/src/theme'
import { StepRowProps, StepRowSkeleton } from 'uniswap/src/components/ConfirmSwapModal/steps/StepRowSkeleton'
import { StepStatus } from 'uniswap/src/components/ConfirmSwapModal/types'
import { useSecondsUntilDeadline } from 'uniswap/src/components/ConfirmSwapModal/useSecondsUntilDeadline'
import { SplitLogo } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { UniswapXSignatureStep } from 'uniswap/src/features/transactions/swap/steps/signOrder'
import {
  SwapTransactionStep,
  SwapTransactionStepAsync,
  SwapTransactionStepBatched,
} from 'uniswap/src/features/transactions/swap/steps/swap'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { logger } from 'utilities/src/logger/logger'

export type SwapSteps = (
  | SwapTransactionStep
  | SwapTransactionStepAsync
  | UniswapXSignatureStep
  | SwapTransactionStepBatched
) &
  TradingApi.PlanStep

/**
 * Component used in the review screen for step by step swap execution. This particular
 * component is used with PlanStep which is a part of Chained Actions.
 */
export function SwapTransactionPlanStepRow({
  step,
  status,
  currentStepIndex,
  totalStepsCount,
}: StepRowProps<SwapSteps>): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()

  const deadline = step.type === TransactionStepType.UniswapXSignature ? step.deadline : undefined
  const { secondsRemaining, ranOutOfTimeTitle } = useSecondsUntilDeadline(deadline, status)

  const inputChain = getChainInfo(step.tokenInChainId as unknown as UniverseChainId)
  const outputChain = getChainInfo(step.tokenOutChainId as unknown as UniverseChainId)
  const inputCurrencyInfo = useCurrencyInfo(buildCurrencyId(inputChain.id, step.tokenIn ?? ''))
  const outputCurrencyInfo = useCurrencyInfo(buildCurrencyId(outputChain.id, step.tokenOut ?? ''))
  const isCrossChain = inputChain.id !== outputChain.id
  const inputTokenSymbol = inputCurrencyInfo?.currency.symbol ?? ''
  const outputTokenSymbol = outputCurrencyInfo?.currency.symbol ?? ''

  const title = useMemo(() => {
    return getStatusText({
      isCrossChain,
      inputTokenSymbol,
      outputTokenSymbol,
      inputChainLabel: inputChain.label,
      outputChainLabel: outputChain.label,
      ranOutOfTimeTitle,
      status,
      t,
    })
  }, [
    isCrossChain,
    inputTokenSymbol,
    outputTokenSymbol,
    inputChain.label,
    outputChain.label,
    t,
    ranOutOfTimeTitle,
    status,
  ])

  const Icon = useMemo(() => {
    if (isCrossChain) {
      return <CrosschainIcon color={colors.accent1.val} size={iconSizes.icon24} />
    }
    return (
      <SplitLogo
        chainId={inputChain.id}
        inputCurrencyInfo={inputCurrencyInfo}
        outputCurrencyInfo={outputCurrencyInfo}
        size={iconSizes.icon24}
      />
    )
  }, [inputChain.id, inputCurrencyInfo, outputCurrencyInfo, isCrossChain, colors.accent1.val])

  return (
    <StepRowSkeleton
      title={title}
      icon={Icon}
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

function getStatusText(params: {
  isCrossChain: boolean
  inputTokenSymbol: string
  outputTokenSymbol: string
  inputChainLabel: string
  outputChainLabel: string
  ranOutOfTimeTitle: string | undefined
  status: StepStatus
  t: TFunction
}): string {
  const {
    isCrossChain,
    inputTokenSymbol,
    outputTokenSymbol,
    inputChainLabel,
    outputChainLabel,
    ranOutOfTimeTitle,
    status,
    t,
  } = params
  if (ranOutOfTimeTitle) {
    return ranOutOfTimeTitle
  }
  if (isCrossChain) {
    const commonParams = {
      inputChain: inputChainLabel,
      outputChain: outputChainLabel,
    }
    switch (status) {
      case StepStatus.Preview:
      case StepStatus.Active:
        return t('swap.review.bridge.idle', commonParams)
      case StepStatus.InProgress:
        return t('swap.review.bridge.pending', commonParams)
      case StepStatus.Complete:
        return t('swap.review.bridge.completed', commonParams)
      default:
        logger.warn('SwapTransactionPlanStepRow', 'getStatusText', 'Unknown status', status)
        return ''
    }
  } else {
    const commonParams = {
      inputTokenSymbol,
      outputTokenSymbol,
    }
    switch (status) {
      case StepStatus.Preview:
      case StepStatus.Active:
        return t('swap.review.swap.idle', commonParams)
      case StepStatus.InProgress:
        return t('swap.review.swap.pending', commonParams)
      case StepStatus.Complete:
        return t('swap.review.swap.completed', commonParams)
      default:
        logger.warn('SwapTransactionPlanStepRow', 'getStatusText', 'Unknown status', status)
        return ''
    }
  }
}
