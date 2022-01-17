import { tokens } from '@uniswap/default-token-list'
import { Token } from '@uniswap/sdk-core'
import { ADDRESS_ZERO } from '@uniswap/v3-sdk'
import { SupportedChainId } from 'constants/chains'
import useActiveWeb3React from 'lib/hooks/useActiveWeb3React'
import { useMemo } from 'react'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import invariant from 'tiny-invariant'

export default function useToken(): Token {
  const { chainId } = useActiveWeb3React()
  return useMemo(() => {
    const UNI = tokens.find(({ chainId, symbol }) => chainId === SupportedChainId.MAINNET && symbol === 'UNI')
    invariant(UNI)
    const mock = {
      ...UNI,
      chainId: chainId || SupportedChainId.MAINNET,
      address: ADDRESS_ZERO,
      symbol: 'MOCK',
      name: 'Mock Token',
    }
    return new WrappedTokenInfo(mock)
  }, [chainId])
}
