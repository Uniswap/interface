import type { DiscriminatedQuoteResponse } from '@universe/api'
import { isMobileApp } from '@universe/environment'
import { Button, Flex, IconButton, Text } from 'ui/src'
import { BackArrow } from 'ui/src/components/icons/BackArrow'
import {
  EarnPlanProgressIndicator,
  type EarnPlanProgressState,
} from 'uniswap/src/features/earn/EarnPlanProgressIndicator'
import { isChainedQuoteResponse } from 'uniswap/src/features/transactions/swap/utils/routing'

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
          isDisabled={onRetry ? false : ctaDisabled}
          onPress={onRetry ?? onPress}
        >
          {onRetry ? retryLabel : ctaLabel}
        </Button>
      </Flex>
    )
  }

  if (progress) {
    return <EarnPlanProgressIndicator progress={progress} />
  }

  if (isExecuting && stepProgressLabel) {
    return (
      <Flex
        row
        alignItems="center"
        justifyContent="center"
        py="$spacing16"
        borderRadius="$rounded16"
        backgroundColor="$surface2"
      >
        <Text variant="buttonLabel2" color="$neutral1">
          {stepProgressLabel}
        </Text>
      </Flex>
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
        isDisabled={ctaDisabled}
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
        isDisabled={ctaDisabled}
        onPress={onPress}
      >
        {ctaLabel}
      </Button>
    </Flex>
  )
}
