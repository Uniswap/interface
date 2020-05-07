import { useMemo } from 'react'
import { ChainId, WETH, Token } from '@uniswap/sdk'
import { useWeb3React } from '../hooks'
import { useLocalStorageTokens } from './LocalStorage'

export const ALL_TOKENS = [
  // WETH on all chains
  ...Object.values(WETH),

  // Mainnet Tokens

  // Rinkeby Tokens
  new Token(ChainId.RINKEBY, '0xc7AD46e0b8a400Bb3C915120d284AafbA8fc4735', 18, 'DAI', 'Dai Stablecoin'),
  new Token(ChainId.RINKEBY, '0x8ab15C890E5C03B5F240f2D146e3DF54bEf3Df44', 18, 'IANV2', 'IAn V2 /Coin'),
  new Token(ChainId.RINKEBY, '0xF9bA5210F91D0474bd1e1DcDAeC4C58E359AaD85', 18, 'MKR', 'Maker'),

  // Kovan Tokens
  new Token(ChainId.KOVAN, '0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa', 18, 'DAI', 'Dai Stablecoin'),

  // Ropsten Tokens
  new Token(ChainId.ROPSTEN, '0xaD6D458402F60fD3Bd25163575031ACDce07538D', 18, 'DAI', 'Dai Stablecoin')

  // Goerli Tokens
]
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
  const [localStorageTokens] = useLocalStorageTokens()

  return useMemo(() => {
    // rename WETH to ETH (in case not used in useToken yet)
    if (ALL_TOKENS[chainId]?.[WETH[chainId]?.address]) {
      ALL_TOKENS[chainId][WETH[chainId].address].name = 'ETH'
      ALL_TOKENS[chainId][WETH[chainId].address].symbol = 'ETH'
    }
    return (
      localStorageTokens
        // filter to the current chain
        .filter(token => token.chainId === chainId)
        // reduce into all ALL_TOKENS filtered by the current chain
        .reduce((tokenMap, token) => {
          return {
            ...tokenMap,
            [token.address]: token
          }
        }, ALL_TOKENS?.[chainId] ?? {})
    )
  }, [localStorageTokens, chainId])
}

export function useToken(tokenAddress: string): Token {
  const tokens = useAllTokens()

  const token = tokens?.[tokenAddress]

  // rename WETH to ETH
  if (token?.equals(WETH[token?.chainId])) {
    ;(token as any).symbol = 'ETH'
    ;(token as any).name = 'Ether'
  }

  return token
}
