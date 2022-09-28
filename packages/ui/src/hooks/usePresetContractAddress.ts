import { CONTRACT_ADDRESS, DEFAULT_TOKEN_NAME, PERIPHERY_NAME } from '@teleswap/sdk'
import { useActiveWeb3React } from 'hooks'
import { useMemo } from 'react'

export function usePresetPeripheryAddress(): { [s in PERIPHERY_NAME]?: string } {
  const { library, chainId } = useActiveWeb3React()

  return useMemo(() => {
    if (!chainId || !library) {
      return {
        [PERIPHERY_NAME.FACTORY]: undefined,
        [PERIPHERY_NAME.ROUTER]: undefined
      }
    }
    return {
      [PERIPHERY_NAME.FACTORY]: CONTRACT_ADDRESS[chainId]?.periphery[PERIPHERY_NAME.FACTORY],
      [PERIPHERY_NAME.ROUTER]: CONTRACT_ADDRESS[chainId]?.periphery[PERIPHERY_NAME.ROUTER]
    }
  }, [library, chainId])
}

export function useDefaultTokensAddress(): { [s in DEFAULT_TOKEN_NAME]?: string } {
  const { library, chainId } = useActiveWeb3React()

  return useMemo(() => {
    if (!chainId || !library) {
      return {
        [DEFAULT_TOKEN_NAME.WETH]: undefined,
        [DEFAULT_TOKEN_NAME.USDC]: undefined,
        [DEFAULT_TOKEN_NAME.USDT]: undefined,
        [DEFAULT_TOKEN_NAME.DAI]: undefined
      }
    }
    return {
      [DEFAULT_TOKEN_NAME.WETH]: CONTRACT_ADDRESS[chainId]?.defaultTokens[DEFAULT_TOKEN_NAME.WETH],
      [DEFAULT_TOKEN_NAME.USDC]: CONTRACT_ADDRESS[chainId]?.defaultTokens[DEFAULT_TOKEN_NAME.USDC],
      [DEFAULT_TOKEN_NAME.USDT]: CONTRACT_ADDRESS[chainId]?.defaultTokens[DEFAULT_TOKEN_NAME.USDT],
      [DEFAULT_TOKEN_NAME.DAI]: CONTRACT_ADDRESS[chainId]?.defaultTokens[DEFAULT_TOKEN_NAME.DAI]
    }
  }, [library, chainId])
}
