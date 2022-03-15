import { Currency, CurrencyAmount, Price, Token, TradeType } from '@uniswap/sdk-core'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import useBlockCache, { ShouldUpdate } from 'lib/hooks/useBlockCache'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { useMemo } from 'react'
import { currencyId } from 'utils/currencyId'

import { SupportedChainId } from '../constants/chains'
import { DAI_OPTIMISM, USDC_ARBITRUM, USDC_MAINNET, USDC_POLYGON } from '../constants/tokens'
import { useBestV2Trade } from './useBestV2Trade'
import { useClientSideV3Trade } from './useClientSideV3Trade'

// Stablecoin amounts used when calculating spot price for a given currency.
// The amount is large enough to filter low liquidity pairs.
export const STABLECOIN_AMOUNT_OUT: { [chainId: number]: CurrencyAmount<Token> } = {
  [SupportedChainId.MAINNET]: CurrencyAmount.fromRawAmount(USDC_MAINNET, 100_000e6),
  [SupportedChainId.ARBITRUM_ONE]: CurrencyAmount.fromRawAmount(USDC_ARBITRUM, 10_000e6),
  [SupportedChainId.OPTIMISM]: CurrencyAmount.fromRawAmount(DAI_OPTIMISM, 10_000e18),
  [SupportedChainId.POLYGON]: CurrencyAmount.fromRawAmount(USDC_POLYGON, 10_000e6),
}

/**
 * Caches USDC prices so that they are only fetched once per currency per block.
 * This prevents multiple calls to determine a currency's USDC price, an expensive operation.
 *
 * useUSDCPrice is used throughout the component tree, and is thus called multiple times and not
 * memoized between them, which can lead to 100+ms blocking delays when prices update.
 *
 * Rather than try to move all usage to a top level (so that useMemo would appropriately cache), a
 * cache external to React allows each currency to be fetched exactly once per block, and limits
 * blocking time to the first call.
 */
const usdcPriceCache = new Map<string, Price<Currency, Token>>()

/**
 * Returns the price in USDC of the input currency
 * @param currency currency to compute the USDC price of
 */
export default function useUSDCPrice(currency?: Currency): Price<Currency, Token> | undefined {
  const amountSpecified = currency?.chainId ? STABLECOIN_AMOUNT_OUT[currency.chainId] : undefined
  const stablecoin = amountSpecified?.currency

  const key = currency && currencyId(currency)
  const [cachedPrice, setCachedPrice] = useBlockCache(usdcPriceCache, key)
  const otherCurrency = useMemo(() => (cachedPrice === ShouldUpdate ? currency : undefined), [cachedPrice, currency])

  const v2Trade = useBestV2Trade(TradeType.EXACT_OUTPUT, amountSpecified, otherCurrency, { maxHops: 2 })
  const { trade: v3Trade } = useClientSideV3Trade(TradeType.EXACT_OUTPUT, amountSpecified, otherCurrency)

  return useMemo(() => {
    if (cachedPrice === ShouldUpdate) {
      const price = computePrice()
      if (price) setCachedPrice(price)
      return price
    }
    return cachedPrice

    function computePrice(): Price<Currency, Token> | undefined {
      if (!currency || !stablecoin) return

      // If currency is the stablecoin, return the stable price.
      if (currency.wrapped.equals(stablecoin)) return new Price(stablecoin, stablecoin, '1', '1')

      // Use v2 price if available, and fallback to v3.
      const route = v2Trade?.route || v3Trade?.routes[0]
      if (route) {
        const { numerator, denominator } = route.midPrice
        const price = new Price(currency, stablecoin, denominator, numerator)
        return price
      }

      return
    }
  }, [cachedPrice, currency, setCachedPrice, stablecoin, v2Trade?.route, v3Trade?.routes])
}

export function useUSDCValue(currencyAmount: CurrencyAmount<Currency> | undefined | null) {
  const price = useUSDCPrice(currencyAmount?.currency)

  return useMemo(() => {
    if (!price || !currencyAmount) return null
    try {
      return price.quote(currencyAmount)
    } catch (error) {
      return null
    }
  }, [currencyAmount, price])
}

/**
 *
 * @param fiatValue string representation of a USD amount
 * @returns CurrencyAmount where currency is stablecoin on active chain
 */
export function useStablecoinAmountFromFiatValue(fiatValue: string | null | undefined) {
  const { chainId } = useActiveWeb3React()
  const stablecoin = chainId ? STABLECOIN_AMOUNT_OUT[chainId]?.currency : undefined

  return useMemo(() => {
    if (fiatValue === null || fiatValue === undefined || !chainId || !stablecoin) {
      return undefined
    }

    // trim for decimal precision when parsing
    const parsedForDecimals = parseFloat(fiatValue).toFixed(stablecoin.decimals).toString()
    try {
      // parse USD string into CurrencyAmount based on stablecoin decimals
      return tryParseCurrencyAmount(parsedForDecimals, stablecoin)
    } catch (error) {
      return undefined
    }
  }, [chainId, fiatValue, stablecoin])
}
