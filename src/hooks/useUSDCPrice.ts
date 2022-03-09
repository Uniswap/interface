import { Currency, CurrencyAmount, Price, Token, TradeType } from '@uniswap/sdk-core'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import useBlockNumber from 'lib/hooks/useBlockNumber'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { useEffect, useMemo } from 'react'

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

const v2USDCPriceCache = new Map<Currency, Price<Currency, Token>>()
const v3USDCPriceCache = new Map<Currency, Price<Currency, Token>>()

/**
 * Returns the price in USDC of the input currency
 * @param currency currency to compute the USDC price of
 */
export default function useUSDCPrice(currency?: Currency): Price<Currency, Token> | undefined {
  // Use a cache per block to avoid recomputing USDC price.
  // USDC price computation involves finding the best route for a currency, and is computationally expensive and blocking.
  const block = useBlockNumber()
  useEffect(() => {
    v2USDCPriceCache.clear()
    v3USDCPriceCache.clear()
  }, [block])

  const chainId = currency?.chainId

  const amountOut = chainId ? STABLECOIN_AMOUNT_OUT[chainId] : undefined
  const stablecoin = amountOut?.currency

  // TODO(#2808): remove dependency on useBestV2Trade
  const v2Currency = currency && v2USDCPriceCache.has(currency) ? undefined : currency
  const v2USDCTrade = useBestV2Trade(TradeType.EXACT_OUTPUT, amountOut, v2Currency, { maxHops: 2 })

  const v3Currency = currency && v2USDCPriceCache.has(currency) ? undefined : currency
  const v3USDCTrade = useClientSideV3Trade(TradeType.EXACT_OUTPUT, amountOut, v3Currency)

  const price = useMemo(() => {
    if (!currency || !stablecoin) {
      return undefined
    }

    // handle stablecoin
    if (currency?.wrapped.equals(stablecoin)) {
      return new Price(stablecoin, stablecoin, '1', '1')
    }

    // use v2 price if available, v3 as fallback
    if (v2USDCTrade) {
      const { numerator, denominator } = v2USDCTrade.route.midPrice
      const price = new Price(currency, stablecoin, denominator, numerator)
      v2USDCPriceCache.set(currency, price)
      return price
    } else if (v2USDCPriceCache.has(currency)) {
      return v2USDCPriceCache.get(currency)
    } else if (v3USDCTrade.trade) {
      const { numerator, denominator } = v3USDCTrade.trade.routes[0].midPrice
      const price = new Price(currency, stablecoin, denominator, numerator)
      v3USDCPriceCache.set(currency, price)
      return price
    } else if (v3USDCPriceCache.has(currency)) {
      return v3USDCPriceCache.get(currency)
    }

    return undefined
  }, [currency, stablecoin, v2USDCTrade, v3USDCTrade.trade])
  return price
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
