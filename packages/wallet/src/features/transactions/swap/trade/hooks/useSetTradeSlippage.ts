import { useMemo } from 'react'
import {
  MAX_AUTO_SLIPPAGE_TOLERANCE,
  MIN_AUTO_SLIPPAGE_TOLERANCE,
} from 'wallet/src/constants/transactions'
import { isL2Chain, toSupportedChainId } from 'wallet/src/features/chains/utils'
import { useUSDCValue } from 'wallet/src/features/transactions/swap/trade/hooks/useUSDCPrice'
import { transformQuoteToTrade } from 'wallet/src/features/transactions/swap/trade/legacy/routeUtils'
import {
  isClassicQuote,
  transformTradingApiResponseToTrade,
} from 'wallet/src/features/transactions/swap/trade/tradingApi/utils'
import { Trade, TradeWithStatus } from 'wallet/src/features/transactions/swap/trade/types'
import { QuoteType } from 'wallet/src/features/transactions/utils'

export function useSetTradeSlippage(
  trade: TradeWithStatus,
  userSetSlippage?: number
): { trade: TradeWithStatus; autoSlippageTolerance: number } {
  // Always calculate and return autoSlippageTolerance so the UI can warn user when custom slippage is set higher than auto slippage
  const autoSlippageTolerance = useCalculateAutoSlippage(trade?.trade)

  return useMemo(() => {
    // If the user has set a custom slippage, use that in the trade instead of the auto-slippage
    if (!trade.trade || userSetSlippage) {
      return { trade, autoSlippageTolerance }
    }

    const { loading, error, isFetching } = trade
    const { tradeType, deadline, quoteData, inputAmount, outputAmount } = trade.trade
    const tokenInIsNative = inputAmount.currency.isNative
    const tokenOutIsNative = outputAmount.currency.isNative

    if (!quoteData) {
      return { trade, autoSlippageTolerance }
    }

    // Based on the quote type, transform the quote data into a trade
    const newTrade =
      quoteData.quoteType === QuoteType.RoutingApi
        ? transformQuoteToTrade(
            tokenInIsNative,
            tokenOutIsNative,
            tradeType,
            deadline,
            autoSlippageTolerance,
            quoteData?.quote
          )
        : transformTradingApiResponseToTrade({
            tokenInIsNative,
            tokenOutIsNative,
            tradeType,
            deadline,
            slippageTolerance: autoSlippageTolerance,
            data: quoteData?.quote,
          })

    return {
      trade: {
        trade: newTrade,
        loading,
        error,
        isFetching,
      },
      autoSlippageTolerance,
    }
  }, [trade, userSetSlippage, autoSlippageTolerance])
}

/*
  Based on: https://github.com/Uniswap/interface/blob/1802f50163bf8092dac6916d64b9e08ac2ae0a74/src/hooks/useAutoSlippageTolerance.ts

  The rationale is the user will be happy so long as the expected "cost" of the slippage is less than
  theoretical cost incurred if the tx were to fail due to slippage being set too conservatively. Therefore,
  slippage is set to be (gas cost in $'s) / (expected swap output value in $'s).

  Note: not using BigNumber because it sucks at decimals and we're dealing with USD values anyways
 */
// TODO: move logic to `transformResponse` method of routingApi when endpoint returns output USD value
function useCalculateAutoSlippage(trade: Maybe<Trade>): number {
  // Enforce quote types
  const isLegacyQuote = trade?.quoteData?.quoteType === QuoteType.RoutingApi

  const outputAmountUSD = useUSDCValue(trade?.outputAmount)?.toExact()

  return useMemo<number>(() => {
    if (isLegacyQuote) {
      const chainId = trade.quoteData.quote?.route[0]?.[0]?.tokenIn?.chainId
      const onL2 = isL2Chain(chainId)
      const gasCostUSD = trade.quoteData.quote?.gasUseEstimateUSD
      return calculateAutoSlippage({ onL2, gasCostUSD, outputAmountUSD })
    } else {
      // TODO:api remove this during Uniswap X integration
      const quote = isClassicQuote(trade?.quoteData?.quote?.quote)
        ? trade?.quoteData?.quote?.quote
        : undefined
      const chainId = toSupportedChainId(quote?.chainId) ?? undefined
      const onL2 = isL2Chain(chainId)
      const gasCostUSD = quote?.gasFeeUSD
      return calculateAutoSlippage({ onL2, gasCostUSD, outputAmountUSD })
    }
  }, [isLegacyQuote, outputAmountUSD, trade])
}

function calculateAutoSlippage({
  onL2,
  gasCostUSD,
  outputAmountUSD,
}: {
  onL2: boolean
  gasCostUSD?: string
  outputAmountUSD?: string
}): number {
  if (onL2 || !gasCostUSD || !outputAmountUSD) {
    return MIN_AUTO_SLIPPAGE_TOLERANCE
  }

  const suggestedSlippageTolerance = (Number(gasCostUSD) / Number(outputAmountUSD)) * 100

  if (suggestedSlippageTolerance > MAX_AUTO_SLIPPAGE_TOLERANCE) {
    return MAX_AUTO_SLIPPAGE_TOLERANCE
  }

  if (suggestedSlippageTolerance < MIN_AUTO_SLIPPAGE_TOLERANCE) {
    return MIN_AUTO_SLIPPAGE_TOLERANCE
  }

  return Number(suggestedSlippageTolerance.toFixed(2))
}
