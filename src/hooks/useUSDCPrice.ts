import { Currency, CurrencyAmount, Price, Token, TradeType } from '@uniswap/sdk-core'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import useBlockNumber from 'lib/hooks/useBlockNumber'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { useEffect, useMemo, useState } from 'react'

import { SupportedChainId } from '../constants/chains'
import { DAI_OPTIMISM, USDC_ARBITRUM, USDC_MAINNET, USDC_POLYGON } from '../constants/tokens'
import { useClientSideV3Trade } from './useClientSideV3Trade'

// Stablecoin amounts used when calculating spot price for a given currency.
// The amount is large enough to filter low liquidity pairs.
export const STABLECOIN_AMOUNT_OUT: { [chainId: number]: CurrencyAmount<Token> } = {
  [SupportedChainId.MAINNET]: CurrencyAmount.fromRawAmount(USDC_MAINNET, 100_000e6),
  [SupportedChainId.ARBITRUM_ONE]: CurrencyAmount.fromRawAmount(USDC_ARBITRUM, 10_000e6),
  [SupportedChainId.OPTIMISM]: CurrencyAmount.fromRawAmount(DAI_OPTIMISM, 10_000e18),
  [SupportedChainId.POLYGON]: CurrencyAmount.fromRawAmount(USDC_POLYGON, 10_000e6),
}

const usdcPriceCache = new Map<Currency, Price<Currency, Token> | undefined>()

/**
 * Returns true if a currency should use the USDC price cache.
 * This prevents multiple calls to determine a currency's USDC price.
 *
 * This is an optimization which mitigates useUSDCPrice being used throughout the component tree.
 * Because it is used on nested elements, it is called multiple times and is not memoized between
 * them, which can lead to 100+ms blocking delays when prices update.
 *
 * Rather than try to move all usage to a top level (so that useMemo would appropriately cache), a
 * cache external to React allows each currency to be fetched exactly once per block, and limits
 * blocking time to the first call.
 */
function useUSDCPriceCache(currency?: Currency): boolean {
  // This hooks should only take "lead" (ie not use the cache) if the cache has not yet been set.
  // This avoids having multiple hooks taking "lead".
  const [lead, setLead] = useState(currency ? !usdcPriceCache.has(currency) : false)
  if (currency && !usdcPriceCache.has(currency)) {
    usdcPriceCache.set(currency, undefined)
    setLead(true)
  }

  // Clears the cache every block.
  const block = useBlockNumber()
  useEffect(() => {
    usdcPriceCache.clear()
    // Immediately set the cache to keep the "lead".
    if (lead && currency) {
      usdcPriceCache.set(currency, undefined)
    }
  }, [block, currency, lead])

  useEffect(() => {
    return () => {
      // If there is not yet a cached value when unmounting, give up the "lead".
      if (lead && currency && !usdcPriceCache.get(currency)) {
        usdcPriceCache.delete(currency)
      }
    }
  })

  return !lead
}

/**
 * Returns the price in USDC of the input currency
 * @param currency currency to compute the USDC price of
 */
export default function useUSDCPrice(currency?: Currency): Price<Currency, Token> | undefined {
  const chainId = currency?.chainId

  const amountSpecified = chainId ? STABLECOIN_AMOUNT_OUT[chainId] : undefined
  const stablecoin = amountSpecified?.currency

  const useCache = useUSDCPriceCache(currency)
  const { trade } = useClientSideV3Trade(TradeType.EXACT_OUTPUT, amountSpecified, useCache ? undefined : currency)

  const price = useMemo(() => {
    if (!currency || !stablecoin) {
      return undefined
    }

    // handle stablecoin
    if (currency?.wrapped.equals(stablecoin)) {
      return new Price(stablecoin, stablecoin, '1', '1')
    }

    if (trade) {
      const { numerator, denominator } = trade.routes[0].midPrice
      const price = new Price(currency, stablecoin, denominator, numerator)
      usdcPriceCache.set(currency, price)
      return price
    } else {
      return usdcPriceCache.get(currency)
    }
  }, [currency, stablecoin, trade])
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
