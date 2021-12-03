import { Currency, CurrencyAmount, Price, Token, TradeType } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { ChainId } from 'src/constants/chains'
import { DAI_OPTIMISM, DAI_RINKEBY, USDC, USDC_ARBITRUM } from 'src/constants/tokens'
import { useQuote } from 'src/features/prices/useQuote'

// Stablecoin amounts used when calculating spot price for a given currency.
// The amount is large enough to filter low liquidity pairs.
const STABLECOIN_AMOUNT_OUT: { [chainId: number]: CurrencyAmount<Token> } = {
  [ChainId.MAINNET]: CurrencyAmount.fromRawAmount(USDC, 100_000e6),
  [ChainId.RINKEBY]: CurrencyAmount.fromRawAmount(DAI_RINKEBY, 100_000e18),
  [ChainId.ARBITRUM_ONE]: CurrencyAmount.fromRawAmount(USDC_ARBITRUM, 10_000e6),
  [ChainId.OPTIMISM]: CurrencyAmount.fromRawAmount(DAI_OPTIMISM, 10_000e18),
}

/**
 * Returns the price in USDC of the input currency
 * @param currency currency to compute the USDC price of
 */
export default function useUSDCPrice(currency?: Currency): Price<Currency, Currency> | undefined {
  const chainId = currency?.chainId

  const quoteAmount = chainId ? STABLECOIN_AMOUNT_OUT[chainId] : undefined
  const stablecoin = quoteAmount?.currency

  // avoid requesting quotes for stablecoin input
  const currencyIsStablecoin = Boolean(stablecoin && currency?.wrapped.equals(stablecoin))
  const amountSpecified = currencyIsStablecoin ? undefined : quoteAmount

  const { data } = useQuote({
    amountSpecified,
    otherCurrency: currency,
    tradeType: TradeType.EXACT_OUTPUT,
  })

  return useMemo(() => {
    if (currencyIsStablecoin && stablecoin) {
      // handle stablecoin
      return new Price(stablecoin, stablecoin, '1', '1')
    }

    if (!data || !quoteAmount || !currency) {
      return undefined
    }

    const baseAmount = CurrencyAmount.fromRawAmount(currency, data.quote)
    return new Price({
      baseAmount,
      quoteAmount,
    })
  }, [currency, stablecoin, data, currencyIsStablecoin, quoteAmount])
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
