import { useQueryClient } from '@tanstack/react-query'
import type { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import type { PriceSource } from '@universe/prices'
import { getTokenPriceSource, normalizeToken } from '@universe/prices'
import { useMemo } from 'react'
import { useUSDCPrice } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import type { IndicativeTrade, Trade } from 'uniswap/src/features/transactions/swap/types/trade'
import type { AnchoredUsdValues } from 'uniswap/src/features/transactions/swap/utils/usdAnchoring/anchoredUsdPricing'
import { computeAnchoredUsdValues } from 'uniswap/src/features/transactions/swap/utils/usdAnchoring/anchoredUsdPricing'
import { logger } from 'utilities/src/logger/logger'

/**
 * USD values for both sides of the swap form, priced from a single external anchor
 * so they can never contradict the trade's quoted conversion rate (INFRA-2364).
 *
 * One side (the anchor — the chain's primary stablecoin when present, else the side
 * with the more trustworthy cached price source) keeps its oracle price; the other
 * side's USD value is derived from the same quote via the classic route mid price,
 * falling back to the execution price, and finally to the legacy independent-oracle
 * behavior when there is no trade (e.g. wraps without a quote).
 */
export function useSwapAnchoredUsdValues({
  trade,
  inputAmount,
  outputAmount,
}: {
  trade: Trade | IndicativeTrade | undefined | null
  inputAmount: Maybe<CurrencyAmount<Currency>>
  outputAmount: Maybe<CurrencyAmount<Currency>>
}): AnchoredUsdValues {
  // oxlint-disable-next-line typescript/no-unnecessary-condition -- defensive: trade amounts are unvalidated quote data
  const inputCurrency = trade?.inputAmount?.currency ?? inputAmount?.currency
  // oxlint-disable-next-line typescript/no-unnecessary-condition -- defensive: trade amounts are unvalidated quote data
  const outputCurrency = trade?.outputAmount?.currency ?? outputAmount?.currency

  const { price: inputUsdPrice } = useUSDCPrice(inputCurrency)
  const { price: outputUsdPrice } = useUSDCPrice(outputCurrency)

  const queryClient = useQueryClient()

  return useMemo(() => {
    const getCachedPriceSource = (currency: Currency | undefined): PriceSource | undefined => {
      if (!currency) {
        return undefined
      }
      try {
        const { chainId, address } = normalizeToken(currency)
        return getTokenPriceSource(queryClient, chainId, address)
      } catch (error) {
        logger.error(error, {
          tags: { file: 'useSwapAnchoredUsdValues', function: 'getCachedPriceSource' },
        })
        return undefined
      }
    }

    return computeAnchoredUsdValues({
      trade,
      inputAmount,
      outputAmount,
      inputUsdPrice,
      outputUsdPrice,
      inputPriceSource: getCachedPriceSource(inputCurrency),
      outputPriceSource: getCachedPriceSource(outputCurrency),
    })
  }, [trade, inputAmount, outputAmount, inputUsdPrice, outputUsdPrice, inputCurrency, outputCurrency, queryClient])
}
