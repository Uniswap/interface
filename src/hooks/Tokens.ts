import { ChainId, Token, WETH } from '@uniswap/sdk'
import { useEffect, useMemo } from 'react'
import { useAddUserToken, useFetchTokenByAddress, useUserAddedTokens } from '../state/user/hooks'
import { useWeb3React } from './index'

export const ALL_TOKENS = [
  // WETH on all chains
  ...Object.values(WETH),

  // Mainnet Tokens
  new Token(ChainId.MAINNET, '0x6B175474E89094C44Da98b954EedeAC495271d0F', 18, 'DAI', 'Dai Stablecoin'),
  new Token(ChainId.MAINNET, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6, 'USDC', 'USD//C'),
  new Token(ChainId.MAINNET, '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2', 18, 'MKR', 'Maker'),

  // Rinkeby Tokens
  new Token(ChainId.RINKEBY, '0xc7AD46e0b8a400Bb3C915120d284AafbA8fc4735', 18, 'DAI', 'Dai Stablecoin'),
  new Token(ChainId.RINKEBY, '0xF9bA5210F91D0474bd1e1DcDAeC4C58E359AaD85', 18, 'MKR', 'Maker'),

  // Kovan Tokens
  new Token(ChainId.KOVAN, '0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa', 18, 'DAI', 'Dai Stablecoin'),
  new Token(ChainId.KOVAN, '0xAaF64BFCC32d0F15873a02163e7E500671a4ffcD', 18, 'MKR', 'Maker'),

  // Ropsten Tokens
  new Token(ChainId.ROPSTEN, '0xaD6D458402F60fD3Bd25163575031ACDce07538D', 18, 'DAI', 'Dai Stablecoin')

  // Goerli Tokens
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
