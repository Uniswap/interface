import { Currency, CurrencyAmount, Price, Token, TradeType } from '@uniswap/sdk-core'
import JSBI from 'jsbi'
import { useMemo } from 'react'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getPrimaryStablecoin, isUniverseChainId } from 'uniswap/src/features/chains/utils'
import { useTrade } from 'uniswap/src/features/transactions/swap/hooks/useTrade'
import { isClassic, isJupiter } from 'uniswap/src/features/transactions/swap/utils/routing'
import { areCurrencyIdsEqual, currencyId } from 'uniswap/src/utils/currencyId'

const SONEIUM_AMOUNT_OVERRIDE = 30
const DEFAULT_STABLECOIN_AMOUNT_OUT = 1000
function getStablecoinAmountOut(chainId: UniverseChainId): CurrencyAmount<Token> {
  const primaryStablecoin = getPrimaryStablecoin(chainId)

  if (chainId === UniverseChainId.Soneium) {
    const amount = SONEIUM_AMOUNT_OVERRIDE * Math.pow(10, primaryStablecoin.decimals)
    return CurrencyAmount.fromRawAmount(primaryStablecoin, amount)
  }

  const amount = DEFAULT_STABLECOIN_AMOUNT_OUT * Math.pow(10, primaryStablecoin.decimals)
  return CurrencyAmount.fromRawAmount(primaryStablecoin, amount)
}

/**
 * Returns the price in USDC of the input currency
 * @param currency currency to compute the USDC price of
 */
export function useUSDCPrice(
  currency?: Currency,
  pollInterval: PollingInterval = PollingInterval.Fast,
): {
  price: Price<Currency, Currency> | undefined
  isLoading: boolean
} {
  const chainId = currency?.chainId

  const quoteAmount = useMemo(
    () => (isUniverseChainId(chainId) ? getStablecoinAmountOut(chainId) : undefined),
    [chainId],
  )
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
    pollInterval,
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

    if (trade && isJupiter(trade) && currency) {
      // Convert the string amounts to JSBI.BigInt values
      const inputAmount = JSBI.BigInt(trade.quote.quote.inAmount)
      const outputAmount = JSBI.BigInt(trade.quote.quote.outAmount)
      return { price: new Price(currency, stablecoin, inputAmount, outputAmount), isLoading }
    }

    if (!trade || !isClassic(trade) || !trade.routes[0] || !currency) {
      return { price: undefined, isLoading }
    }

    const { numerator, denominator } = trade.routes[0].midPrice
    return { price: new Price(currency, stablecoin, denominator, numerator), isLoading }
  }, [currency, stablecoin, currencyIsStablecoin, trade, isLoading])
}

export function useUSDCValue(
  currencyAmount: CurrencyAmount<Currency> | undefined | null,
  pollInterval: PollingInterval = PollingInterval.Fast,
): CurrencyAmount<Currency> | null {
  const { price } = useUSDCPrice(currencyAmount?.currency, pollInterval)

  return useMemo(() => {
    if (!price || !currencyAmount) {
      return null
    }
    try {
      return price.quote(currencyAmount)
    } catch (_error) {
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
    } catch (_error) {
      return {
        value: null,
        isLoading: false,
      }
    }
  }, [currencyAmount, isLoading, price])
}
