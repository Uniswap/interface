import { ChainId, Token, WETH } from '@uniswap/sdk'
import { useEffect, useMemo } from 'react'
import { ALL_TOKENS } from '../constants/tokens'
import { useAddUserToken, useFetchTokenByAddress, useUserAddedTokens } from '../state/user/hooks'
import { isAddress } from '../utils'

import { useActiveWeb3React } from './index'

export function useAllTokens(): { [address: string]: Token } {
  const { chainId } = useActiveWeb3React()
  const userAddedTokens = useUserAddedTokens()

  return useMemo(() => {
    if (!chainId) return {}
    const tokens = userAddedTokens
      // reduce into all ALL_TOKENS filtered by the current chain
      .reduce<{ [address: string]: Token }>(
        (tokenMap, token) => {
          tokenMap[token.address] = token
          return tokenMap
        },
        // must make a copy because reduce modifies the map, and we do not
        // want to make a copy in every iteration
        { ...ALL_TOKENS[chainId as ChainId] }
      )

    const weth = WETH[chainId as ChainId]
    if (weth) {
      // we have to replace it as a workaround because if it is automatically
      // fetched by address it will cause an invariant when used in constructing
      // pairs since we replace the name and symbol with 'ETH' and 'Ether'
      tokens[weth.address] = WETH[chainId as ChainId]
    }
    return tokens
  }, [userAddedTokens, chainId])
}

export function useToken(tokenAddress: string): Token {
  const tokens = useAllTokens()

  return tokens?.[tokenAddress]
}

// gets token information by address (typically user input) and
// automatically adds it for the user if the token address is valid
export function useTokenByAddressAndAutomaticallyAdd(tokenAddress?: string): Token | undefined {
  const fetchTokenByAddress = useFetchTokenByAddress()
  const addToken = useAddUserToken()
  const allTokens = useAllTokens()
  const { chainId } = useActiveWeb3React()

  useEffect(() => {
    if (!chainId) return
    const weth = WETH[chainId as ChainId]
    if (weth && weth.address === isAddress(tokenAddress)) return

    if (tokenAddress && !allTokens?.[tokenAddress]) {
      fetchTokenByAddress(tokenAddress).then(token => {
        if (token !== null) {
          addToken(token)
        }
      })
    }
  }, [tokenAddress, allTokens, fetchTokenByAddress, addToken, chainId])

  return tokenAddress ? allTokens?.[tokenAddress] : undefined
}
