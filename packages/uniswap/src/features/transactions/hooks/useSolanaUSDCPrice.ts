import { Currency, CurrencyAmount, Price, Token, TradeType } from '@uniswap/sdk-core'
import JSBI from 'jsbi'
import { useMemo } from 'react'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getPrimaryStablecoin } from 'uniswap/src/features/chains/utils'
import { useTrade } from 'uniswap/src/features/transactions/swap/hooks/useTrade'
import { isJupiter } from 'uniswap/src/features/transactions/swap/utils/routing'
import { areCurrencyIdsEqual, currencyId } from 'uniswap/src/utils/currencyId'

const DEFAULT_STABLECOIN_AMOUNT_OUT = 1000

function getSolanaStablecoinAmountOut(): CurrencyAmount<Token> {
  const primaryStablecoin = getPrimaryStablecoin(UniverseChainId.Solana)
  const amount = DEFAULT_STABLECOIN_AMOUNT_OUT * Math.pow(10, primaryStablecoin.decimals)
  return CurrencyAmount.fromRawAmount(primaryStablecoin, amount)
}

/**
 * Returns the price in USDC of a Solana currency using the quote path.
 * Non-Solana currencies intentionally no-op; remote pricing handles them.
 *
 * @param currency currency to compute the USDC price of
 */
export function useSolanaUSDCPrice(
  currency?: Currency,
  pollInterval: PollingInterval = PollingInterval.Fast,
): {
  price: Price<Currency, Currency> | undefined
  isLoading: boolean
} {
  const solanaCurrency = currency?.chainId === UniverseChainId.Solana ? currency : undefined
  const quoteAmount = useMemo(() => (solanaCurrency ? getSolanaStablecoinAmountOut() : undefined), [solanaCurrency])
  const stablecoin = getPrimaryStablecoin(UniverseChainId.Solana)

  // avoid requesting quotes for stablecoin input
  const currencyIsStablecoin = Boolean(
    solanaCurrency && areCurrencyIdsEqual(currencyId(solanaCurrency), currencyId(stablecoin)),
  )
  const amountSpecified = solanaCurrency && !currencyIsStablecoin ? quoteAmount : undefined

  const { trade, isLoading } = useTrade({
    amountSpecified,
    otherCurrency: solanaCurrency,
    tradeType: TradeType.EXACT_OUTPUT,
    pollInterval,
    isUSDQuote: true,
  })

  return useMemo(() => {
    if (!solanaCurrency) {
      return { price: undefined, isLoading: false }
    }

    if (currencyIsStablecoin) {
      // handle stablecoin
      return { price: new Price(stablecoin, stablecoin, '1', '1'), isLoading: false }
    }

    if (trade && isJupiter(trade)) {
      // Convert the string amounts to JSBI.BigInt values
      const inputAmount = JSBI.BigInt(trade.quote.quote.inAmount)
      const outputAmount = JSBI.BigInt(trade.quote.quote.outAmount)
      return { price: new Price(solanaCurrency, stablecoin, inputAmount, outputAmount), isLoading }
    }

    return { price: undefined, isLoading }
  }, [solanaCurrency, stablecoin, currencyIsStablecoin, trade, isLoading])
}
