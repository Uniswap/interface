import { useMemo } from 'react'
import { WETH, Token, TokenAmount, Trade, ChainId, Pair } from '@uniswap/sdk'
import { useActiveWeb3React } from './index'
import { usePair } from '../data/Reserves'

const DAI = new Token(ChainId.MAINNET, '0x6B175474E89094C44Da98b954EedeAC495271d0F', 18, 'DAI', 'Dai Stablecoin')
const USDC = new Token(ChainId.MAINNET, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6, 'USDC', 'USD//C')
function useAllCommonPairs(tokenA?: Token, tokenB?: Token): Pair[] {
  const { chainId } = useActiveWeb3React()

  // check for direct pair between tokens
  const pairBetween = usePair(tokenA, tokenB)

  // get token<->WETH pairs
  const aToETH = usePair(tokenA, WETH[chainId])
  const bToETH = usePair(tokenB, WETH[chainId])

  // get token<->DAI pairs
  const aToDAI = usePair(tokenA, chainId === ChainId.MAINNET ? DAI : null)
  const bToDAI = usePair(tokenB, chainId === ChainId.MAINNET ? DAI : null)

  // get token<->USDC pairs
  const aToUSDC = usePair(tokenA, chainId === ChainId.MAINNET ? USDC : null)
  const bToUSDC = usePair(tokenB, chainId === ChainId.MAINNET ? USDC : null)

  // get connecting pairs
  const DAIToETH = usePair(chainId === ChainId.MAINNET ? DAI : null, WETH[chainId])
  const USDCToETH = usePair(chainId === ChainId.MAINNET ? USDC : null, WETH[chainId])
  const DAIToUSDC = usePair(chainId === ChainId.MAINNET ? DAI : null, chainId === ChainId.MAINNET ? USDC : null)

  // only pass along valid pairs, non-duplicated pairs
  return useMemo(
    () =>
      [pairBetween, aToETH, bToETH, aToDAI, bToDAI, aToUSDC, bToUSDC, DAIToETH, USDCToETH, DAIToUSDC]
        // filter out invalid pairs
        .filter(p => !!p)
        // filter out duplicated pairs
        .filter(
          (p, i, pairs) => i === pairs.findIndex(pair => pair?.liquidityToken.address === p.liquidityToken.address)
        ),
    [pairBetween, aToETH, bToETH, aToDAI, bToDAI, aToUSDC, bToUSDC, DAIToETH, USDCToETH, DAIToUSDC]
  )
}

/**
 * Returns the best trade for the exact amount of tokens in to the given token out
 */
export function useTradeExactIn(amountIn?: TokenAmount, tokenOut?: Token): Trade | null {
  const inputToken = amountIn?.token
  const outputToken = tokenOut

  const allowedPairs = useAllCommonPairs(inputToken, outputToken)

  return useMemo(() => {
    if (amountIn && tokenOut && allowedPairs.length > 0) {
      return Trade.bestTradeExactIn(allowedPairs, amountIn, tokenOut)[0] ?? null
    }
    return null
  }, [allowedPairs, amountIn, tokenOut])
}

/**
 * Returns the best trade for the token in to the exact amount of token out
 */
export function useTradeExactOut(tokenIn?: Token, amountOut?: TokenAmount): Trade | null {
  const inputToken = tokenIn
  const outputToken = amountOut?.token

  const allowedPairs = useAllCommonPairs(inputToken, outputToken)

  return useMemo(() => {
    if (tokenIn && amountOut && allowedPairs.length > 0) {
      return Trade.bestTradeExactOut(allowedPairs, tokenIn, amountOut)[0] ?? null
    }
    return null
  }, [allowedPairs, tokenIn, amountOut])
}
