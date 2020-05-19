import { ChainId, Token, WETH } from '@uniswap/sdk'
import { useEffect, useMemo } from 'react'
import { useAddUserToken, useFetchTokenByAddress, useUserAddedTokens } from '../state/user/hooks'

import { useActiveWeb3React } from './index'
import MAINNET_TOKENS from '../constants/tokens/mainnet'
import RINKEBY_TOKENS from '../constants/tokens/rinkeby'
import KOVAN_TOKENS from '../constants/tokens/kovan'
import ROPSTEN_TOKENS from '../constants/tokens/ropsten'

type AllTokens = { [chainId in ChainId]?: { [tokenAddress: string]: Token } }
export const ALL_TOKENS: Readonly<AllTokens> = [
  // WETH on all chains
  ...Object.values(WETH),
  // chain-specific tokens
  ...MAINNET_TOKENS,
  ...RINKEBY_TOKENS,
  ...KOVAN_TOKENS,
  ...ROPSTEN_TOKENS
]
  // remap WETH to ETH
  .map(token => {
    if (token.equals(WETH[token.chainId])) {
      ;(token as any).symbol = 'ETH'
      ;(token as any).name = 'Ether'
    }
    return token
  })
  // put into an object
  .reduce<AllTokens>((tokenMap, token) => {
    if (tokenMap?.[token.chainId]?.[token.address] !== undefined) throw Error('Duplicate tokens.')
    return {
      ...tokenMap,
      [token.chainId]: {
        ...tokenMap?.[token.chainId],
        [token.address]: token
      }
    }
  }, {})

export function useAllTokens(): { [address: string]: Token } {
  const { chainId } = useActiveWeb3React()
  const userAddedTokens = useUserAddedTokens()

  return useMemo(() => {
    if (!chainId) return {}
    return (
      userAddedTokens
        // reduce into all ALL_TOKENS filtered by the current chain
        .reduce<{ [address: string]: Token }>(
          (tokenMap, token) => {
            tokenMap[token.address] = token
            return tokenMap
          },
          { ...ALL_TOKENS[chainId] }
        )
    )
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

  useEffect(() => {
    if (tokenAddress && !allTokens?.[tokenAddress]) {
      fetchTokenByAddress(tokenAddress).then(token => {
        if (token !== null) {
          addToken(token)
        }
      })
    }
  }, [tokenAddress, allTokens, fetchTokenByAddress, addToken])

  return allTokens?.[tokenAddress]
}
