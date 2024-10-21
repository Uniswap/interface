import { Currency, CurrencyAmount, Price, Token, TradeType } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { PollingInterval } from 'uniswap/src/constants/misc'
import {
  USDB_BLAST,
  USDC,
  USDC_ARBITRUM,
  USDC_ASTROCHAIN_SEPOLIA,
  USDC_AVALANCHE,
  USDC_BASE,
  USDC_CELO,
  USDC_OPTIMISM,
  USDC_POLYGON,
  USDC_SEPOLIA,
  USDC_WORLD_CHAIN,
  USDC_ZKSYNC,
  USDC_ZORA,
  USDT_BNB,
} from 'uniswap/src/constants/tokens'
import { useTrade } from 'uniswap/src/features/transactions/swap/hooks/useTrade'
import { isClassic } from 'uniswap/src/features/transactions/swap/utils/routing'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { areCurrencyIdsEqual, currencyId } from 'uniswap/src/utils/currencyId'

// Stablecoin amounts used when calculating spot price for a given currency.
// The amount is large enough to filter low liquidity pairs.
export const STABLECOIN_AMOUNT_OUT: { [chainId: number]: CurrencyAmount<Token> } = {
  [UniverseChainId.Mainnet]: CurrencyAmount.fromRawAmount(USDC, 100_000e6),
  [UniverseChainId.Sepolia]: CurrencyAmount.fromRawAmount(USDC_SEPOLIA, 100_000e6),
  [UniverseChainId.ArbitrumOne]: CurrencyAmount.fromRawAmount(USDC_ARBITRUM, 10_000e6),
  [UniverseChainId.Base]: CurrencyAmount.fromRawAmount(USDC_BASE, 10_000e6),
  [UniverseChainId.Bnb]: CurrencyAmount.fromRawAmount(USDT_BNB, 10_000e18),
  [UniverseChainId.Polygon]: CurrencyAmount.fromRawAmount(USDC_POLYGON, 10_000e6),
  [UniverseChainId.Optimism]: CurrencyAmount.fromRawAmount(USDC_OPTIMISM, 10_000e6),
  [UniverseChainId.Blast]: CurrencyAmount.fromRawAmount(USDB_BLAST, 10_000e18),
  [UniverseChainId.Avalanche]: CurrencyAmount.fromRawAmount(USDC_AVALANCHE, 10_000e6),
  [UniverseChainId.Celo]: CurrencyAmount.fromRawAmount(USDC_CELO, 10_000e18),
  [UniverseChainId.WorldChain]: CurrencyAmount.fromRawAmount(USDC_WORLD_CHAIN, 10_000e6),
  [UniverseChainId.Zora]: CurrencyAmount.fromRawAmount(USDC_ZORA, 10_000e6),
  [UniverseChainId.Zksync]: CurrencyAmount.fromRawAmount(USDC_ZKSYNC, 10_000e6),
  [UniverseChainId.AstrochainSepolia]: CurrencyAmount.fromRawAmount(USDC_ASTROCHAIN_SEPOLIA, 10_000e6),
}

/**
 * Returns the price in USDC of the input currency
 * @param currency currency to compute the USDC price of
 */
export function useUSDCPrice(currency?: Currency): {
  price: Price<Currency, Currency> | undefined
  isLoading: boolean
} {
  const chainId = currency?.chainId

  const quoteAmount = chainId ? STABLECOIN_AMOUNT_OUT[chainId] : undefined
  const stablecoin = quoteAmount?.currency

  // avoid requesting quotes for stablecoin input
  const currencyIsStablecoin = Boolean(
    stablecoin && currency && areCurrencyIdsEqual(currencyId(currency), currencyId(stablecoin)),
  )
  const amountSpecified = currencyIsStablecoin ? undefined : quoteAmount

  const { trade, isLoading } = useTrade({
    amountSpecified,
    otherCurrency: currency,
    tradeType: TradeType.EXACT_OUTPUT,
    pollInterval: PollingInterval.Fast,
    isUSDQuote: true,
  })

  return useMemo(() => {
    if (!stablecoin) {
      return { price: undefined, isLoading: false }
    }

    if (currencyIsStablecoin) {
      // handle stablecoin
      return { price: new Price(stablecoin, stablecoin, '1', '1'), isLoading: false }
    }

    if (!trade || !isClassic(trade) || !trade.routes?.[0] || !quoteAmount || !currency) {
      return { price: undefined, isLoading }
    }

    const { numerator, denominator } = trade.routes[0].midPrice
    return { price: new Price(currency, stablecoin, denominator, numerator), isLoading }
  }, [currency, stablecoin, currencyIsStablecoin, quoteAmount, trade, isLoading])
}

export function useUSDCValue(
  currencyAmount: CurrencyAmount<Currency> | undefined | null,
): CurrencyAmount<Currency> | null {
  const { price } = useUSDCPrice(currencyAmount?.currency)

  return useMemo(() => {
    if (!price || !currencyAmount) {
      return null
    }
    try {
      return price.quote(currencyAmount)
    } catch (error) {
      return null
    }
  }, [currencyAmount, price])
}

/**
 * @param currencyAmount
 * @returns Returns fiat value of the currency amount, and loading status of the currency<->stable quote
 */
export function useUSDCValueWithStatus(currencyAmount: CurrencyAmount<Currency> | undefined | null): {
  value: CurrencyAmount<Currency> | null
  isLoading: boolean
} {
  const { price, isLoading } = useUSDCPrice(currencyAmount?.currency)

  return useMemo(() => {
    if (!price || !currencyAmount) {
      return { value: null, isLoading }
    }
    try {
      return { value: price.quote(currencyAmount), isLoading }
    } catch (error) {
      return {
        value: null,
        isLoading: false,
      }
    }
  }, [currencyAmount, isLoading, price])
}
