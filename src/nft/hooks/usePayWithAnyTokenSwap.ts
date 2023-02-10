import { Protocol } from '@uniswap/router-sdk'
import { Currency, CurrencyAmount, Percent, Token, TradeType } from '@uniswap/sdk-core'
import {
  PermitInput,
  TokenTradeRouteInput,
  TokenTradeRoutesInput,
  TokenTradeType,
} from 'graphql/data/__generated__/types-and-hooks'
import { Allowance } from 'hooks/usePermit2Allowance'
import { useEffect } from 'react'
import { InterfaceTrade } from 'state/routing/types'

import { useTokenInput } from './useTokenInput'

export default function usePayWithAnyTokenSwap(
  trade?: InterfaceTrade<Currency, Currency, TradeType> | undefined,
  allowance?: Allowance,
  allowedSlippage?: Percent
) {
  const setTokenTradeInput = useTokenInput((state) => state.setTokenTradeInput)
  const hasRoutes = !!trade && trade.routes
  const hasInputAmount = !!trade && !!trade.inputAmount && trade.inputAmount.currency.isToken
  const hasAllowance = !!allowedSlippage && !!allowance && 'permitSignature' in allowance

  useEffect(() => {
    if (!hasRoutes || !hasInputAmount || !hasAllowance || !allowance.permitSignature) {
      setTokenTradeInput(undefined)
      return
    }

    const slippage = parseInt(allowedSlippage.multiply(100).toSignificant(2))
    let mixedTokenTradeRouteInputs: TokenTradeRouteInput[] | undefined
    let v2TokenTradeRouteInputs: TokenTradeRouteInput[] | undefined
    let v3TokenTradeRouteInputs: TokenTradeRouteInput[] | undefined

    const mixedRoutes = trade.swaps.filter((swap) => swap.route.protocol === Protocol.MIXED)
    const v2Routes = trade.swaps.filter((swap) => swap.route.protocol === Protocol.V2)
    const v3Routes = trade.swaps.filter((swap) => swap.route.protocol === Protocol.V3)

    if (mixedRoutes.length > 0) {
      mixedTokenTradeRouteInputs = mixedRoutes.map((swap) => ({
        inputAmount: {
          amount: swap.inputAmount.quotient.toString(),
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
          amount: swap.outputAmount.quotient.toString(),
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
                    amount: pool.getInputAmount(swap.outputAmount as CurrencyAmount<Token>)[0].quotient.toString(),
                    token: {
                      address: pool.token0.address,
                      chainId: pool.token0.chainId,
                      decimals: pool.token0.decimals,
                      isNative: pool.token0.isNative,
                    },
                  },
                  tokenAmountB: {
                    amount: pool.getOutputAmount(swap.inputAmount as CurrencyAmount<Token>)[0].quotient.toString(),
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
          amount: swap.inputAmount.quotient.toString(),
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
          amount: swap.outputAmount.quotient.toString(),
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
                    amount: pool.getInputAmount(swap.outputAmount as CurrencyAmount<Token>)[0].quotient.toString(),
                    token: {
                      address: pool.token0.address,
                      chainId: pool.token0.chainId,
                      decimals: pool.token0.decimals,
                      isNative: pool.token0.isNative,
                    },
                  },
                  tokenAmountB: {
                    amount: pool.getOutputAmount(swap.inputAmount as CurrencyAmount<Token>)[0].quotient.toString(),
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
          amount: swap.inputAmount.quotient.toString(),
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
          amount: swap.outputAmount.quotient.toString(),
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

    const permitInput: PermitInput = {
      details: {
        amount: allowance.permitSignature.details.amount.toString(),
        expiration: allowance.permitSignature.details.expiration.toString(),
        nonce: allowance.permitSignature.details.nonce.toString(),
        token: allowance.permitSignature.details.token,
      },
      sigDeadline: allowance.permitSignature.sigDeadline.toString(),
      signature: allowance.permitSignature.signature,
      spender: allowance.permitSignature.spender,
    }

    setTokenTradeInput({
      permit: permitInput,
      routes,
      slippageToleranceBasisPoints: slippage,
      tokenAmount: {
        amount: trade.inputAmount.quotient.toString(),
        token: {
          address: trade.inputAmount.currency.address,
          chainId: trade.inputAmount.currency.chainId,
          decimals: trade.inputAmount.currency.decimals,
          isNative: trade.inputAmount.currency.isNative,
        },
      },
    })
  }, [allowance, allowedSlippage, hasAllowance, hasInputAmount, hasRoutes, setTokenTradeInput, trade])
}
