import { Token, WETH } from '@uniswap/sdk'
import { useEffect, useMemo } from 'react'
import { useAddUserToken, useFetchTokenByAddress, useUserAddedTokens } from '../state/user/hooks'

import { useWeb3React } from './index'
import MAINNET_TOKENS from '../constants/tokens/mainnet'
import RINKEBY_TOKENS from '../constants/tokens/rinkeby'
import KOVAN_TOKENS from '../constants/tokens/kovan'
import ROPSTEN_TOKENS from '../constants/tokens/ropsten'

export const ALL_TOKENS = [
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
  .reduce((tokenMap, token) => {
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
  const { chainId } = useWeb3React()
  const userAddedTokens = useUserAddedTokens()

  return useMemo(() => {
    return (
      userAddedTokens
        // reduce into all ALL_TOKENS filtered by the current chain
        .reduce<{ [address: string]: Token }>((tokenMap, token) => {
          tokenMap[token.address] = token
          return tokenMap
        }, ALL_TOKENS[chainId] ?? {})
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

  return useMemo(() => allTokens?.[tokenAddress], [allTokens, tokenAddress])
}
