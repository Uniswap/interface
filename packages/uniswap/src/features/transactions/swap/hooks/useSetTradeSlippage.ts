import { useMemo } from 'react'
import { MAX_AUTO_SLIPPAGE_TOLERANCE, MIN_AUTO_SLIPPAGE_TOLERANCE } from 'uniswap/src/constants/transactions'
import { isMainnetChainId, toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { DynamicConfigs, SwapConfigKey } from 'uniswap/src/features/gating/configs'
import { useDynamicConfigValue } from 'uniswap/src/features/gating/hooks'
import { useUSDCValue } from 'uniswap/src/features/transactions/swap/hooks/useUSDCPrice'
import { Trade, TradeWithStatus } from 'uniswap/src/features/transactions/swap/types/trade'
import { isBridge } from 'uniswap/src/features/transactions/swap/utils/routing'
import {
  getClassicQuoteFromResponse,
  transformTradingApiResponseToTrade,
} from 'uniswap/src/features/transactions/swap/utils/tradingApi'

export function useSetTradeSlippage(
  trade: TradeWithStatus,
  userSetSlippage?: number,
): { trade: TradeWithStatus; autoSlippageTolerance: number } {
  // Always calculate and return autoSlippageTolerance so the UI can warn user when custom slippage is set higher than auto slippage
  const autoSlippageTolerance = useCalculateAutoSlippage(trade?.trade)

  return useMemo(() => {
    if (trade.trade && isBridge(trade.trade)) {
      // Bridge trades don't have slippage
      return { trade, autoSlippageTolerance: 0 }
    }
    // If the user has set a custom slippage, use that in the trade instead of the auto-slippage
    if (!trade.trade || userSetSlippage) {
      return { trade, autoSlippageTolerance }
    }

    const { isLoading, error, isFetching, indicativeTrade, isIndicativeLoading } = trade
    const { tradeType, deadline, quote, inputAmount, outputAmount } = trade.trade

    if (!quote) {
      return { trade, autoSlippageTolerance }
    }

    const newTrade = transformTradingApiResponseToTrade({
      currencyIn: inputAmount.currency,
      currencyOut: outputAmount.currency,
      tradeType,
      deadline,
      slippageTolerance: autoSlippageTolerance,
      data: quote,
    })

    return {
      trade: {
        isLoading,
        isFetching,
        trade: newTrade,
        indicativeTrade,
        isIndicativeLoading,
        error,
        gasEstimates: trade.gasEstimates,
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
function useCalculateAutoSlippage(trade: Maybe<Trade>): number {
  const outputAmountUSD = useUSDCValue(trade?.outputAmount)?.toExact()

  const minAutoSlippageToleranceL2 = useDynamicConfigValue(
    DynamicConfigs.Swap,
    SwapConfigKey.MinAutoSlippageToleranceL2,
    0,
  )

  return useMemo<number>(() => {
    const quote = getClassicQuoteFromResponse(trade?.quote)
    const chainId = toSupportedChainId(quote?.chainId) ?? undefined
    const onL2 = !isMainnetChainId(chainId)
    const gasCostUSD = quote?.gasFeeUSD
    return calculateAutoSlippage({
      onL2,
      minAutoSlippageToleranceL2,
      gasCostUSD,
      outputAmountUSD,
    })
  }, [minAutoSlippageToleranceL2, outputAmountUSD, trade])
}

function calculateAutoSlippage({
  onL2,
  minAutoSlippageToleranceL2,
  gasCostUSD,
  outputAmountUSD,
}: {
  onL2: boolean
  minAutoSlippageToleranceL2: number
  gasCostUSD?: string
  outputAmountUSD?: string
}): number {
  if (onL2) {
    return minAutoSlippageToleranceL2
  }

  if (!gasCostUSD || !outputAmountUSD) {
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
