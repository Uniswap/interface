import { useMemo } from 'react'
import { WETH, Token, TokenAmount, Trade } from '@uniswap/sdk'
import { useWeb3React } from './index'
import { usePair } from '../contexts/Pairs'
import { isWETH } from '../utils'

/**
 * Returns the best trade for the exact amount of tokens in to the given token out
 */
export function useTradeExactIn(amountIn?: TokenAmount, tokenOut?: Token): Trade | null {
  const { chainId } = useWeb3React()

  // check for direct pair between tokens
  const pairBetween = usePair(amountIn?.token, tokenOut)

  // get token<->WETH pairs
  const aToETH = usePair(amountIn && !isWETH(amountIn.token) ? amountIn.token : null, WETH[chainId])
  const bToETH = usePair(tokenOut && !isWETH(tokenOut) ? tokenOut : null, WETH[chainId])

  return useMemo(() => {
    const allPairs = [pairBetween, aToETH, bToETH].filter(p => !!p)

    if (amountIn && allPairs.length > 0 && tokenOut) {
      return Trade.bestTradeExactIn(allPairs, amountIn, tokenOut)[0] ?? null
    }
    return null
  }, [aToETH, bToETH, pairBetween, amountIn, tokenOut])
}

/**
 * Returns the best trade for the token in to the exact amount of token out
 */
export function useTradeExactOut(tokenIn?: Token, amountOut?: TokenAmount): Trade | null {
  const { chainId } = useWeb3React()

  // check for direct pair between tokens
  const pairBetween = usePair(amountOut?.token, tokenIn)

  // get token<->WETH pairs
  const aToETH = usePair(amountOut && !isWETH(amountOut.token) ? amountOut.token : null, WETH[chainId])
  const bToETH = usePair(tokenIn && !isWETH(tokenIn) ? tokenIn : null, WETH[chainId])

  return useMemo(() => {
    const allPairs = [pairBetween, aToETH, bToETH].filter(p => !!p)

    if (amountOut && allPairs.length > 0 && tokenIn) {
      return Trade.bestTradeExactOut(allPairs, tokenIn, amountOut)[0] ?? null
    }
    return null
  }, [pairBetween, aToETH, bToETH, amountOut, tokenIn])
}
