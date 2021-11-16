import { Trade } from '@uniswap/router-sdk'
import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { Route, SwapQuoter } from '@uniswap/v3-sdk'
import { SupportedChainId } from 'constants/chains'
import { BIG_INT_ZERO } from 'constants/misc'
import JSBI from 'jsbi'
import { useMemo } from 'react'
import { TradeState } from 'state/routing/types'
import { useTradeFromRoute } from 'state/routing/useTradeFromRoute'

import { useSingleContractWithCallData } from '../state/multicall/hooks'
import { useAllV3Routes } from './useAllV3Routes'
import { useV3Quoter } from './useContract'
import { useActiveWeb3React } from './web3'

const QUOTE_GAS_OVERRIDES: { [chainId: number]: number } = {
  [SupportedChainId.ARBITRUM_ONE]: 25_000_000,
  [SupportedChainId.ARBITRUM_RINKEBY]: 25_000_000,
}

const DEFAULT_GAS_QUOTE = 2_000_000

/**
 * Returns the best v3 trade for a desired swap using the legacy client-side router
 * @param tradeType whether the swap is an exact in/out
 * @param amountSpecified the exact amount to swap in/out
 * @param otherCurrency the desired output/payment currency
 */
export function useClientSideV3Trade<TTradeType extends TradeType>(
  tradeType: TTradeType,
  amountSpecified?: CurrencyAmount<Currency>,
  otherCurrency?: Currency
): { state: TradeState; trade: Trade<Currency, Currency, TTradeType> | undefined } {
  const [currencyIn, currencyOut] = useMemo(
    () =>
      tradeType === TradeType.EXACT_INPUT
        ? [amountSpecified?.currency, otherCurrency]
        : [otherCurrency, amountSpecified?.currency],
    [tradeType, amountSpecified, otherCurrency]
  )
  const { routes, loading: routesLoading } = useAllV3Routes(currencyIn, currencyOut)

  const quoter = useV3Quoter()
  const { chainId } = useActiveWeb3React()
  const quotesResults = useSingleContractWithCallData(
    quoter,
    amountSpecified
      ? routes.map((route) => SwapQuoter.quoteCallParameters(route, amountSpecified, tradeType).calldata)
      : [],
    {
      gasRequired: chainId ? QUOTE_GAS_OVERRIDES[chainId] ?? DEFAULT_GAS_QUOTE : undefined,
    }
  )
  const { valid, loading } = useMemo(
    () => ({
      valid: quotesResults?.some(({ valid }) => !valid),
      loading: quotesResults?.some(({ loading }) => loading),
    }),
    [quotesResults]
  )

  const route = useMemo(
    () =>
      currencyIn && currencyOut && valid && !loading
        ? quotesResults.reduce(
            (
              currentBest: {
                bestRoute: Route<Currency, Currency> | null | undefined
                amountIn: CurrencyAmount<Currency> | null | undefined
                amountOut: CurrencyAmount<Currency> | null | undefined
              },
              { result },
              i
            ) => {
              if (!result) return currentBest

              // overwrite the current best if it's not defined or if this route is better
              if (tradeType === TradeType.EXACT_INPUT) {
                const amountOut = CurrencyAmount.fromRawAmount(currencyOut, result.amountOut.toString())
                if (
                  currentBest.amountOut === null ||
                  JSBI.lessThan(currentBest.amountOut?.quotient ?? BIG_INT_ZERO, amountOut.quotient)
                ) {
                  return {
                    bestRoute: routes[i],
                    amountIn: amountSpecified,
                    amountOut,
                  }
                }
              } else {
                const amountIn = CurrencyAmount.fromRawAmount(currencyIn, result.amountIn.toString())
                if (
                  currentBest.amountIn === null ||
                  JSBI.greaterThan(currentBest.amountIn?.quotient ?? BIG_INT_ZERO, amountIn.quotient)
                ) {
                  return {
                    bestRoute: routes[i],
                    amountIn,
                    amountOut: amountSpecified,
                  }
                }
              }

              return currentBest
            },
            {
              bestRoute: null,
              amountIn: null,
              amountOut: null,
            }
          )
        : undefined,
    [amountSpecified, currencyIn, currencyOut, loading, quotesResults, routes, tradeType, valid]
  )

  const trade = useTradeFromRoute(
    route?.amountIn && route.amountOut
      ? {
          // client-side router does not return multi-route paths
          route: [
            {
              routev3: route?.bestRoute ?? null,
              routev2: null,
              amount: tradeType === TradeType.EXACT_INPUT ? route?.amountIn : route?.amountOut,
            },
          ],
          tradeType,
        }
      : undefined
  )

  return useMemo(() => {
    if (
      !amountSpecified ||
      !currencyIn ||
      !currencyOut ||
      quotesResults.some(({ valid }) => !valid) ||
      // skip when tokens are the same
      (tradeType === TradeType.EXACT_INPUT
        ? amountSpecified.currency.equals(currencyOut)
        : amountSpecified.currency.equals(currencyIn))
    ) {
      return {
        state: TradeState.INVALID,
        trade: undefined,
      }
    }

    if (routesLoading || quotesResults.some(({ loading }) => loading)) {
      return {
        state: TradeState.LOADING,
        trade: undefined,
      }
    }

    if (!trade) {
      return {
        state: TradeState.NO_ROUTE_FOUND,
        trade: undefined,
      }
    }

    return {
      state: TradeState.VALID,
      trade,
    }
  }, [amountSpecified, currencyIn, currencyOut, quotesResults, routesLoading, trade, tradeType])
}
