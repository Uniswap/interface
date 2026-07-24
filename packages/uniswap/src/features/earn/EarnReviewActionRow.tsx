import type { DiscriminatedQuoteResponse } from '@universe/api'
import { isMobileApp, isWebApp } from '@universe/environment'
import { Button, Flex, IconButton } from 'ui/src'
import { BackArrow } from 'ui/src/components/icons/BackArrow'
import {
  EarnPlanProgressIndicator,
  type EarnPlanProgressState,
} from 'uniswap/src/features/earn/EarnPlanProgressIndicator'
import { PendingSwapButtonContent } from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/SwapReviewFooter/PendingSwapButtonContent'
import { isChainedQuoteResponse } from 'uniswap/src/features/transactions/swap/utils/routing'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { noop } from 'utilities/src/react/noop'

/** Shared CTA gating for the Earn deposit/withdraw review views. */
export function getEarnReviewCtaDisabled({
  hasBlockingError = false,
  isSubmitting,
  isExecuting,
  isQuotePending,
  quote,
  hasAccount,
  hasInputAmount,
  hasExecuteHandler,
}: {
  hasBlockingError?: boolean
  isSubmitting: boolean
  isExecuting: boolean
  isQuotePending: boolean
  quote: DiscriminatedQuoteResponse | null | undefined
  hasAccount: boolean
  hasInputAmount: boolean
  hasExecuteHandler: boolean
}): boolean {
  return (
    hasBlockingError ||
    isSubmitting ||
    isQuotePending ||
    !quote ||
    !isChainedQuoteResponse(quote) ||
    !hasAccount ||
    !hasInputAmount ||
    !hasExecuteHandler ||
    isExecuting
  )
}

interface EarnReviewActionRowProps {
  ctaDisabled: boolean
  ctaLabel: string
  executionError?: Error
  isExecuting: boolean
  isShortMobileDevice: boolean
  onRetry?: () => void
  progress: EarnPlanProgressState | undefined
  retryLabel: string
  stepProgressLabel: string | undefined
  onBack: () => void
  onPress: () => void
}

export function EarnReviewActionRow({
  ctaDisabled,
  ctaLabel,
  executionError,
  isExecuting,
  isShortMobileDevice,
  onRetry,
  progress,
  retryLabel,
  stepProgressLabel,
  onBack,
  onPress,
}: EarnReviewActionRowProps): JSX.Element {
  if (executionError && !isMobileApp && onRetry) {
    return (
      <Button fill={false} width="100%" variant="branded" emphasis="primary" size="large" onPress={onRetry}>
        {retryLabel}
      </Button>
    )
  }

  if (executionError && isMobileApp) {
    return (
      <Flex row gap="$spacing8">
        <IconButton
          icon={<BackArrow />}
          emphasis="secondary"
          size={isShortMobileDevice ? 'medium' : 'large'}
          onPress={onBack}
        />
        <Button
          fill={false}
          flex={1}
          variant="branded"
          emphasis="primary"
          size="large"
          disabled={onRetry ? false : ctaDisabled}
          onPress={onRetry ?? onPress}
        >
          {onRetry ? retryLabel : ctaLabel}
        </Button>
      </Flex>
    )
  }

  if (isWebApp && progress) {
    return <EarnPlanProgressIndicator progress={progress} />
  }

  if (isMobileApp && isExecuting && progress && stepProgressLabel) {
    return (
      <PendingSwapButtonContent
        disabled={ctaDisabled}
        // +1 offsets the synthetic plan-fetch segment at index 0 of the progress estimates
        currentStepIndex={progress.currentStepIndex + 1}
        steps={progress.steps}
        submissionText={stepProgressLabel}
        testID={TestID.EarnReviewAction}
        onSubmit={noop}
      />
    )
  }

  if (!isMobileApp) {
    return (
      <Button
        fill={false}
        width="100%"
        variant="branded"
        emphasis="primary"
        size="large"
        disabled={ctaDisabled}
        onPress={onPress}
      >
        {ctaLabel}
      </Button>
    )
  }

  return (
    <Flex row gap="$spacing8">
      <IconButton
        icon={<BackArrow />}
        emphasis="secondary"
        size={isShortMobileDevice ? 'medium' : 'large'}
        onPress={onBack}
      />
      <Button
        fill={false}
        flex={1}
        variant="branded"
        emphasis="primary"
        size="large"
        disabled={ctaDisabled}
        onPress={onPress}
      >
        {ctaLabel}
      </Button>
    </Flex>
  )
}
