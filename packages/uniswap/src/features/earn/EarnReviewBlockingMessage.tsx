import type { AppTFunction } from 'ui/src/i18n/types'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { EarnInlineError } from 'uniswap/src/features/earn/EarnInlineError'
import { useEarnInsufficientGasWarning } from 'uniswap/src/features/earn/hooks/useEarnInsufficientGasWarning'
import { isEarnNoRoutesQuoteError } from 'uniswap/src/features/earn/quoteError'
import { InsufficientNativeTokenWarning } from 'uniswap/src/features/transactions/components/InsufficientNativeTokenWarning/InsufficientNativeTokenWarning'

export function EarnReviewBlockingMessage({
  executionErrorMessage,
  hasQuoteError,
  insufficientGasWarning,
  quoteErrorMessage,
  showTroubleshootingLink,
}: {
  executionErrorMessage: string | undefined
  hasQuoteError: boolean
  insufficientGasWarning: ReturnType<typeof useEarnInsufficientGasWarning>
  quoteErrorMessage: string | undefined
  showTroubleshootingLink: boolean
}): JSX.Element | null {
  if (executionErrorMessage) {
    return (
      <EarnInlineError
        message={executionErrorMessage}
        learnMoreUrl={showTroubleshootingLink ? UniswapHelpUrls.articles.earnTroubleshooting : undefined}
      />
    )
  }
  if (hasQuoteError && quoteErrorMessage) {
    return <EarnInlineError message={quoteErrorMessage} />
  }
  if (insufficientGasWarning.hasInsufficientGas) {
    return (
      <InsufficientNativeTokenWarning
        flow={insufficientGasWarning.flow}
        gasFee={insufficientGasWarning.gasFee}
        warnings={insufficientGasWarning.warnings}
      />
    )
  }
  return null
}

export function getEarnReviewHasBlockingError({
  hasQuoteError,
  insufficientGasWarning,
}: {
  hasQuoteError: boolean
  insufficientGasWarning: ReturnType<typeof useEarnInsufficientGasWarning>
}): boolean {
  return hasQuoteError || insufficientGasWarning.hasInsufficientGas
}

export function getEarnDepositQuoteErrorMessage({
  hasQuoteError,
  error,
  t,
}: {
  hasQuoteError: boolean
  error: unknown
  t: AppTFunction
}): string | undefined {
  return getEarnQuoteErrorMessage({
    hasQuoteError,
    error,
    t,
    noRoutesKey: 'explore.earn.deposit.noRoutes',
  })
}

function getEarnQuoteErrorMessage({
  hasQuoteError,
  error,
  t,
  noRoutesKey,
}: {
  hasQuoteError: boolean
  error: unknown
  t: AppTFunction
  noRoutesKey: 'explore.earn.deposit.noRoutes' | 'explore.earn.withdraw.noRoutes'
}): string | undefined {
  if (!hasQuoteError) {
    return undefined
  }
  if (isEarnNoRoutesQuoteError(error)) {
    return t(noRoutesKey)
  }
  return t('explore.earn.review.quoteError')
}
