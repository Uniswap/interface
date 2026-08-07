import type { AppTFunction } from 'ui/src/i18n/types'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { EarnInlineError } from 'uniswap/src/features/earn/EarnInlineError'
import { useEarnInsufficientGasWarning } from 'uniswap/src/features/earn/hooks/useEarnInsufficientGasWarning'
import {
  isEarnInsufficientDestinationGasQuoteError,
  isEarnNoRoutesQuoteError,
} from 'uniswap/src/features/earn/quoteError'
import { InsufficientNativeTokenWarning } from 'uniswap/src/features/transactions/components/InsufficientNativeTokenWarning/InsufficientNativeTokenWarning'

export function EarnReviewBlockingMessage({
  executionErrorMessage,
  hasQuoteError,
  insufficientGasWarning,
  quoteError,
  quoteErrorMessage,
  showTroubleshootingLink,
}: {
  executionErrorMessage: string | undefined
  hasQuoteError: boolean
  insufficientGasWarning: ReturnType<typeof useEarnInsufficientGasWarning>
  quoteError?: unknown
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
    return (
      <EarnInlineError
        message={quoteErrorMessage}
        learnMoreUrl={
          isEarnInsufficientDestinationGasQuoteError(quoteError)
            ? UniswapHelpUrls.articles.earnTroubleshooting
            : undefined
        }
      />
    )
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
  destinationChainId,
  t,
}: {
  hasQuoteError: boolean
  error: unknown
  destinationChainId: UniverseChainId
  t: AppTFunction
}): string | undefined {
  if (hasQuoteError && isEarnInsufficientDestinationGasQuoteError(error)) {
    const destinationChain = getChainInfo(destinationChainId)
    return t('transaction.warning.insufficientGas.modal.title.withNetwork', {
      networkName: destinationChain.label,
      tokenSymbol: destinationChain.nativeCurrency.symbol,
    })
  }

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
