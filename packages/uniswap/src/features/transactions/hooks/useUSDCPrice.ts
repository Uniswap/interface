import { Currency, CurrencyAmount, Price, Token, TradeType } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { PollingInterval } from 'uniswap/src/constants/misc'
import {
  USDB_BLAST,
  USDC,
  USDC_ARBITRUM,
  USDC_AVALANCHE,
  USDC_BASE,
  USDC_BNB,
  USDC_CELO,
  USDC_OPTIMISM,
  USDC_POLYGON,
  USDC_SEPOLIA,
  USDC_SONEIUM,
  USDC_UNICHAIN,
  USDC_UNICHAIN_SEPOLIA,
  USDC_WORLD_CHAIN,
  USDC_ZKSYNC,
  USDC_ZORA,
  USDT_MONAD_TESTNET,
} from 'uniswap/src/constants/tokens'
import { UniverseChainId, isUniverseChainId } from 'uniswap/src/features/chains/types'
import { useTrade } from 'uniswap/src/features/transactions/swap/hooks/useTrade'
import { isClassic } from 'uniswap/src/features/transactions/swap/utils/routing'
import { areCurrencyIdsEqual, currencyId } from 'uniswap/src/utils/currencyId'

const USDC_DEFAULT_MIN = 1_000e6
const USDC_18_DEFAULT_MIN = 1_000e18
const USDC_SONEIUM_DEFAULT_MIN = 3_0000e4

// Stablecoin amounts used when calculating spot price for a given currency.
// The amount is large enough to filter low liquidity pairs.
export const STABLECOIN_AMOUNT_OUT: Record<UniverseChainId, CurrencyAmount<Token>> = {
  [UniverseChainId.Mainnet]: CurrencyAmount.fromRawAmount(USDC, USDC_DEFAULT_MIN),
  [UniverseChainId.ArbitrumOne]: CurrencyAmount.fromRawAmount(USDC_ARBITRUM, USDC_DEFAULT_MIN),
  [UniverseChainId.Avalanche]: CurrencyAmount.fromRawAmount(USDC_AVALANCHE, USDC_DEFAULT_MIN),
  [UniverseChainId.Base]: CurrencyAmount.fromRawAmount(USDC_BASE, USDC_DEFAULT_MIN),
  [UniverseChainId.Blast]: CurrencyAmount.fromRawAmount(USDB_BLAST, USDC_18_DEFAULT_MIN),
  [UniverseChainId.Bnb]: CurrencyAmount.fromRawAmount(USDC_BNB, USDC_18_DEFAULT_MIN),
  [UniverseChainId.Celo]: CurrencyAmount.fromRawAmount(USDC_CELO, USDC_18_DEFAULT_MIN),
  [UniverseChainId.MonadTestnet]: CurrencyAmount.fromRawAmount(USDT_MONAD_TESTNET, USDC_DEFAULT_MIN),
  [UniverseChainId.Optimism]: CurrencyAmount.fromRawAmount(USDC_OPTIMISM, USDC_DEFAULT_MIN),
  [UniverseChainId.Polygon]: CurrencyAmount.fromRawAmount(USDC_POLYGON, USDC_DEFAULT_MIN),
  [UniverseChainId.Sepolia]: CurrencyAmount.fromRawAmount(USDC_SEPOLIA, USDC_DEFAULT_MIN),
  [UniverseChainId.Soneium]: CurrencyAmount.fromRawAmount(USDC_SONEIUM, USDC_SONEIUM_DEFAULT_MIN),
  [UniverseChainId.Unichain]: CurrencyAmount.fromRawAmount(USDC_UNICHAIN, USDC_DEFAULT_MIN),
  [UniverseChainId.UnichainSepolia]: CurrencyAmount.fromRawAmount(USDC_UNICHAIN_SEPOLIA, USDC_DEFAULT_MIN),
  [UniverseChainId.WorldChain]: CurrencyAmount.fromRawAmount(USDC_WORLD_CHAIN, USDC_DEFAULT_MIN),
  [UniverseChainId.Zksync]: CurrencyAmount.fromRawAmount(USDC_ZKSYNC, USDC_DEFAULT_MIN),
  [UniverseChainId.Zora]: CurrencyAmount.fromRawAmount(USDC_ZORA, USDC_DEFAULT_MIN),
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

  const quoteAmount = isUniverseChainId(chainId) ? STABLECOIN_AMOUNT_OUT[chainId] : undefined
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
