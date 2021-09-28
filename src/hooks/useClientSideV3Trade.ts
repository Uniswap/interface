import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { Trade } from '@uniswap/v3-sdk'
import { useMemo } from 'react'
import { computeRoutes } from 'state/routing/computeRoutes'
import { V3TradeState } from 'state/routing/types'
import { useClientSideSmartOrderRouter } from 'worker/useSmartOrderRouter'

/**
 * Returns the best v3 trade for a desired swap
 * @param tradeType whether the swap is an exact in/out
 * @param amountSpecified the exact amount to swap in/out
 * @param otherCurrency the desired output/payment currency
 */
export function useClientSideV3Trade(
  tradeType: TradeType.EXACT_INPUT | TradeType.EXACT_OUTPUT,
  amountSpecified?: CurrencyAmount<Currency>,
  otherCurrency?: Currency
): {
  state: V3TradeState
  trade: Trade<Currency, Currency, TradeType.EXACT_INPUT> | Trade<Currency, Currency, TradeType.EXACT_OUTPUT> | null
} {
  const [currencyIn, currencyOut]: [Currency | undefined, Currency | undefined] = useMemo(
    () =>
      tradeType === TradeType.EXACT_INPUT
        ? [amountSpecified?.currency, otherCurrency]
        : [otherCurrency, amountSpecified?.currency],
    [amountSpecified, otherCurrency, tradeType]
  )

  const { isLoading, isError, quote } = useClientSideSmartOrderRouter(
    tradeType,
    amountSpecified,
    currencyIn,
    currencyOut
  )

  const routes = useMemo(() => computeRoutes(currencyIn, currencyOut, quote), [currencyIn, currencyOut, quote])

  return useMemo(() => {
    if (!currencyIn || !currencyOut) {
      return {
        state: V3TradeState.INVALID,
        trade: null,
      }
    }

    if (isLoading) {
      return {
        state: V3TradeState.LOADING,
        trade: null,
      }
    }

    if (isError || !routes || routes.length === 0) {
      return {
        state: V3TradeState.NO_ROUTE_FOUND,
        trade: null,
      }
    }

    const trade = Trade.createUncheckedTradeWithMultipleRoutes<Currency, Currency, TradeType>({ routes, tradeType })

    return {
      // always return VALID regardless of isFetching status
      state: V3TradeState.VALID,
      trade,
    }
  }, [currencyIn, currencyOut, isLoading, isError, routes, tradeType])
}
