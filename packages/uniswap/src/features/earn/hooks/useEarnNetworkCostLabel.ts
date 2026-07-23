import { type ChainedQuoteResponse, type DiscriminatedQuoteResponse } from '@universe/api'
import { useMemo } from 'react'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { convertGasFeeToDisplayValue } from 'uniswap/src/features/gas/convertGasFeeToDisplayValue'
import { useUSDValueOfGasFee } from 'uniswap/src/features/gas/hooks'
import { getDisplayGasStrategy } from 'uniswap/src/features/gas/utils'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { isChainedQuoteResponse } from 'uniswap/src/features/transactions/swap/utils/routing'
import { NumberType } from 'utilities/src/format/types'

const NETWORK_COST_UNAVAILABLE = '—'

function parseFiniteGasFeeUsd(gasFeeUsd: string | undefined): number | undefined {
  if (gasFeeUsd === undefined) {
    return undefined
  }

  const parsed = Number(gasFeeUsd)
  return Number.isFinite(parsed) ? parsed : undefined
}

function getQuoteGasFeeUsd(quote: ChainedQuoteResponse['quote'] | undefined): string | undefined {
  // Generated types use gasFeeUSD; REST chained quotes can return gasFeeUsd.
  return quote?.gasFeeUSD ?? (quote as (ChainedQuoteResponse['quote'] & { gasFeeUsd?: string }) | undefined)?.gasFeeUsd
}

/**
 * Fiat-only network cost label for the Earn deposit/withdraw review views.
 * Returns `undefined` while loading (render a skeleton) and `—` when no cost can be shown.
 * Never returns a native-token amount — falling back to e.g. "0.0001 ETH" reads as a flicker
 * once a refreshed quote lands with aggregate fiat gas.
 */
export function useEarnNetworkCostLabel({
  chainId,
  isLoading,
  quote,
}: {
  chainId: UniverseChainId
  isLoading: boolean
  quote: DiscriminatedQuoteResponse | null | undefined
}): string | undefined {
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const chainedQuote = isChainedQuoteResponse(quote) ? quote.quote : undefined
  const isCrossChainQuote = chainedQuote !== undefined && chainedQuote.tokenInChainId !== chainedQuote.tokenOutChainId
  const quoteGasFeeUsd = parseFiniteGasFeeUsd(getQuoteGasFeeUsd(chainedQuote))

  const displayGasFee = useMemo<string | undefined>(() => {
    if (chainedQuote?.gasFee === undefined) {
      return undefined
    }

    return convertGasFeeToDisplayValue({
      gasFee: chainedQuote.gasFee,
      gasStrategy: getDisplayGasStrategy(chainedQuote.gasEstimates?.[0]?.strategy),
    })
  }, [chainedQuote])

  // Same-chain fallback only; cross-chain raw gas spans multiple native currencies.
  const shouldConvertNativeFee = quoteGasFeeUsd === undefined && !isCrossChainQuote && displayGasFee !== undefined
  const { value: convertedGasFeeUsd, isLoading: isConvertedGasFeeUsdLoading } = useUSDValueOfGasFee(
    shouldConvertNativeFee ? chainId : undefined,
    shouldConvertNativeFee ? displayGasFee : undefined,
  )

  return useMemo(() => {
    if (isLoading) {
      return undefined
    }

    if (!chainedQuote) {
      return NETWORK_COST_UNAVAILABLE
    }

    if (quoteGasFeeUsd !== undefined) {
      // Convert quote USD to the user's selected fiat currency.
      return convertFiatAmountFormatted(quoteGasFeeUsd, NumberType.FiatStandard)
    }

    if (!shouldConvertNativeFee) {
      return NETWORK_COST_UNAVAILABLE
    }

    if (isConvertedGasFeeUsdLoading) {
      return undefined
    }

    return convertedGasFeeUsd !== undefined
      ? convertFiatAmountFormatted(Number(convertedGasFeeUsd), NumberType.FiatStandard)
      : NETWORK_COST_UNAVAILABLE
  }, [
    chainedQuote,
    convertFiatAmountFormatted,
    convertedGasFeeUsd,
    isConvertedGasFeeUsdLoading,
    isLoading,
    quoteGasFeeUsd,
    shouldConvertNativeFee,
  ])
}
