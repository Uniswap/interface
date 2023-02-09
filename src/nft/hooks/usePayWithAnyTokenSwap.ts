import { Protocol } from '@uniswap/router-sdk'
import { Currency, CurrencyAmount, NativeCurrency, Token, TradeType } from '@uniswap/sdk-core'
import { TokenTradeRouteInput, TokenTradeRoutesInput, TokenTradeType } from 'graphql/data/__generated__/types-and-hooks'
import useAutoSlippageTolerance from 'hooks/useAutoSlippageTolerance'
import { useBestTrade } from 'hooks/useBestTrade'
import { useEffect, useMemo } from 'react'
import { InterfaceTrade, TradeState } from 'state/routing/types'
import shallow from 'zustand/shallow'

import { useTokenInput } from './useTokenInput'

export default function usePayWithAnyTokenSwap(
  inputCurrency?: Currency,
  parsedOutputAmount?: CurrencyAmount<NativeCurrency | Token>
): {
  state: TradeState
  trade: InterfaceTrade<Currency, Currency, TradeType> | undefined
  maximumAmountIn: CurrencyAmount<Token> | undefined
} {
  const { setRoutes, setSlippageToleranceBasisPoints } = useTokenInput(
    ({ setRoutes, setSlippageToleranceBasisPoints }) => ({
      setRoutes,
      setSlippageToleranceBasisPoints,
    }),
    shallow
  )
  const { state, trade } = useBestTrade(TradeType.EXACT_OUTPUT, parsedOutputAmount, inputCurrency ?? undefined)
  const allowedSlippage = useAutoSlippageTolerance(trade)
  const maximumAmountIn = useMemo(() => {
    const maximumAmountIn = trade?.maximumAmountIn(allowedSlippage)
    return maximumAmountIn?.currency.isToken ? (maximumAmountIn as CurrencyAmount<Token>) : undefined
  }, [allowedSlippage, trade])

  useEffect(() => {
    setSlippageToleranceBasisPoints(parseInt(allowedSlippage.multiply(100).toSignificant(2)))

    if (!trade || !trade?.routes) {
      setRoutes(undefined)
      return
    }

    let mixedTokenTradeRouteInputs: TokenTradeRouteInput[] | undefined
    let v2TokenTradeRouteInputs: TokenTradeRouteInput[] | undefined
    let v3TokenTradeRouteInputs: TokenTradeRouteInput[] | undefined

    const mixedRoutes = trade.swaps.filter((swap) => swap.route.protocol === Protocol.MIXED)
    const v2Routes = trade.swaps.filter((swap) => swap.route.protocol === Protocol.V2)
    const v3Routes = trade.swaps.filter((swap) => swap.route.protocol === Protocol.V3)

    if (mixedRoutes.length > 0) {
      mixedTokenTradeRouteInputs = mixedRoutes.map((swap) => ({
        inputAmount: {
          amount: swap.inputAmount.toExact(),
          token: {
            address: swap.inputAmount.currency.isToken
              ? swap.inputAmount.currency.address
              : '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
            chainId: swap.inputAmount.currency.chainId,
            decimals: swap.inputAmount.currency.decimals,
            isNative: swap.inputAmount.currency.isNative,
          },
        },
        outputAmount: {
          amount: swap.outputAmount.toExact(),
          token: {
            address: swap.outputAmount.currency.isToken
              ? swap.outputAmount.currency.address
              : '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
            chainId: swap.outputAmount.currency.chainId,
            decimals: swap.outputAmount.currency.decimals,
            isNative: swap.outputAmount.currency.isNative,
          },
        },
        pools: swap.route.pools.map((pool) => ({
          pair:
            'fee' in pool
              ? undefined
              : {
                  tokenAmountA: {
                    amount: pool.getInputAmount(swap.outputAmount as CurrencyAmount<Token>)[0].toExact(),
                    token: {
                      address: pool.token0.address,
                      chainId: pool.token0.chainId,
                      decimals: pool.token0.decimals,
                      isNative: pool.token0.isNative,
                    },
                  },
                  tokenAmountB: {
                    amount: pool.getOutputAmount(swap.inputAmount as CurrencyAmount<Token>)[0].toExact(),
                    token: {
                      address: pool.token1.address,
                      chainId: pool.token1.chainId,
                      decimals: pool.token1.decimals,
                      isNative: pool.token1.isNative,
                    },
                  },
                },
          pool:
            'fee' in pool
              ? {
                  fee: pool.fee,
                  liquidity: pool.liquidity.toString(),
                  sqrtRatioX96: pool.sqrtRatioX96.toString(),
                  tickCurrent: pool.tickCurrent.toString(),
                  tokenA: {
                    address: pool.token0.address,
                    chainId: pool.token0.chainId,
                    decimals: pool.token0.decimals,
                    isNative: pool.token0.isNative,
                  },
                  tokenB: {
                    address: pool.token1.address,
                    chainId: pool.token1.chainId,
                    decimals: pool.token1.decimals,
                    isNative: pool.token1.isNative,
                  },
                }
              : undefined,
        })),
      }))
    }

    if (v2Routes.length > 0) {
      v2TokenTradeRouteInputs = v2Routes.map((swap) => ({
        inputAmount: {
          amount: swap.inputAmount.toExact(),
          token: {
            address: swap.inputAmount.currency.isToken
              ? swap.inputAmount.currency.address
              : '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
            chainId: swap.inputAmount.currency.chainId,
            decimals: swap.inputAmount.currency.decimals,
            isNative: swap.inputAmount.currency.isNative,
          },
        },
        outputAmount: {
          amount: swap.outputAmount.toExact(),
          token: {
            address: swap.outputAmount.currency.isToken
              ? swap.outputAmount.currency.address
              : '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
            chainId: swap.outputAmount.currency.chainId,
            decimals: swap.outputAmount.currency.decimals,
            isNative: swap.outputAmount.currency.isNative,
          },
        },
        pools: swap.route.pools.map((pool) => ({
          pair:
            'fee' in pool
              ? undefined
              : {
                  tokenAmountA: {
                    amount: pool.getInputAmount(swap.outputAmount as CurrencyAmount<Token>)[0].toExact(),
                    token: {
                      address: pool.token0.address,
                      chainId: pool.token0.chainId,
                      decimals: pool.token0.decimals,
                      isNative: pool.token0.isNative,
                    },
                  },
                  tokenAmountB: {
                    amount: pool.getOutputAmount(swap.inputAmount as CurrencyAmount<Token>)[0].toExact(),
                    token: {
                      address: pool.token1.address,
                      chainId: pool.token1.chainId,
                      decimals: pool.token1.decimals,
                      isNative: pool.token1.isNative,
                    },
                  },
                },
          pool: undefined,
        })),
      }))
    }

    if (v3Routes.length > 0) {
      v3TokenTradeRouteInputs = v3Routes.map((swap) => ({
        inputAmount: {
          amount: swap.inputAmount.toExact(),
          token: {
            address: swap.inputAmount.currency.isToken
              ? swap.inputAmount.currency.address
              : '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
            chainId: swap.inputAmount.currency.chainId,
            decimals: swap.inputAmount.currency.decimals,
            isNative: swap.inputAmount.currency.isNative,
          },
        },
        outputAmount: {
          amount: swap.outputAmount.toExact(),
          token: {
            address: swap.outputAmount.currency.isToken
              ? swap.outputAmount.currency.address
              : '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
            chainId: swap.outputAmount.currency.chainId,
            decimals: swap.outputAmount.currency.decimals,
            isNative: swap.outputAmount.currency.isNative,
          },
        },
        pools: swap.route.pools.map((pool) => ({
          pair: undefined,
          pool:
            'fee' in pool
              ? {
                  fee: pool.fee,
                  liquidity: pool.liquidity.toString(),
                  sqrtRatioX96: pool.sqrtRatioX96.toString(),
                  tickCurrent: pool.tickCurrent.toString(),
                  tokenA: {
                    address: pool.token0.address,
                    chainId: pool.token0.chainId,
                    decimals: pool.token0.decimals,
                    isNative: pool.token0.isNative,
                  },
                  tokenB: {
                    address: pool.token1.address,
                    chainId: pool.token1.chainId,
                    decimals: pool.token1.decimals,
                    isNative: pool.token1.isNative,
                  },
                }
              : undefined,
        })),
      }))
    }

    const routes: TokenTradeRoutesInput = {
      mixedRoutes: mixedTokenTradeRouteInputs,
      tradeType: TokenTradeType.ExactOutput,
      v2Routes: v2TokenTradeRouteInputs,
      v3Routes: v3TokenTradeRouteInputs,
    }

    setRoutes(routes)
  }, [allowedSlippage, setRoutes, setSlippageToleranceBasisPoints, trade])

  return useMemo(() => {
    return {
      state,
      trade,
      maximumAmountIn,
    }
  }, [maximumAmountIn, state, trade])
}
