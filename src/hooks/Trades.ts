import { useMemo } from 'react'
import { WETH, Token, TokenAmount, Trade, ChainId } from '@uniswap/sdk'
import { useWeb3React } from './index'
import { usePair } from '../data/Reserves'

/**
 * Returns the best trade for the exact amount of tokens in to the given token out
 */
const DAI = new Token(ChainId.MAINNET, '0x6B175474E89094C44Da98b954EedeAC495271d0F', 18, 'DAI', 'Dai Stablecoin')
const USDC = new Token(ChainId.MAINNET, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6, 'USDC', 'USD//C')
export function useTradeExactIn(amountIn?: TokenAmount, tokenOut?: Token): Trade | null {
  const inputToken = amountIn?.token
  const outputToken = tokenOut

  const { chainId } = useWeb3React()

  // check for direct pair between tokens
  const pairBetween = usePair(inputToken, outputToken)

  // get token<->WETH pairs
  const aToETH = usePair(inputToken, WETH[chainId])
  const bToETH = usePair(outputToken, WETH[chainId])

  // get token<->DAI pairs
  const aToDAI = usePair(inputToken, chainId === ChainId.MAINNET ? DAI : null)
  const bToDAI = usePair(outputToken, chainId === ChainId.MAINNET ? DAI : null)

  // get token<->USDC pairs
  const aToUSDC = usePair(inputToken, chainId === ChainId.MAINNET ? USDC : null)
  const bToUSDC = usePair(outputToken, chainId === ChainId.MAINNET ? USDC : null)

  return useMemo(() => {
    const allPairs = [pairBetween, aToETH, bToETH, aToDAI, bToDAI, aToUSDC, bToUSDC].filter(p => !!p)

    if (amountIn && tokenOut && allPairs.length > 0) {
      try {
        // TODO(moodysalem): remove when the insufficient reserves/input errors do not throw exceptions
        return Trade.bestTradeExactIn(allPairs, amountIn, tokenOut)[0] ?? null
      } catch (error) {
        return null
      }
    }
    return null
  }, [pairBetween, aToETH, bToETH, aToDAI, bToDAI, aToUSDC, bToUSDC, amountIn, tokenOut])
}

/**
 * Returns the best trade for the token in to the exact amount of token out
 */
export function useTradeExactOut(tokenIn?: Token, amountOut?: TokenAmount): Trade | null {
  const inputToken = tokenIn
  const outputToken = amountOut?.token

  const { chainId } = useWeb3React()

  // check for direct pair between tokens
  const pairBetween = usePair(amountOut?.token, tokenIn)

  // get token<->WETH pairs
  const aToETH = usePair(inputToken, WETH[chainId])
  const bToETH = usePair(outputToken, WETH[chainId])

  // get token<->DAI pairs
  const aToDAI = usePair(inputToken, chainId === ChainId.MAINNET ? DAI : null)
  const bToDAI = usePair(outputToken, chainId === ChainId.MAINNET ? DAI : null)

  // get token<->USDC pairs
  const aToUSDC = usePair(inputToken, chainId === ChainId.MAINNET ? USDC : null)
  const bToUSDC = usePair(outputToken, chainId === ChainId.MAINNET ? USDC : null)

  return useMemo(() => {
    const allPairs = [pairBetween, aToETH, bToETH, aToDAI, bToDAI, aToUSDC, bToUSDC].filter(p => !!p)

    if (tokenIn && amountOut && allPairs.length > 0) {
      try {
        // TODO(moodysalem): remove when the insufficient reserves/input errors do not throw exceptions
        return Trade.bestTradeExactOut(allPairs, tokenIn, amountOut)[0] ?? null
      } catch (error) {
        return null
      }
    }
    return null
  }, [pairBetween, aToETH, bToETH, aToDAI, bToDAI, aToUSDC, bToUSDC, tokenIn, amountOut])
}
