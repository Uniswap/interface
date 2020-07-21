import { ChainId, Token } from '@uniswap/sdk'
import { TokenList } from '@uniswap/token-lists'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { AppState } from '../index'

export type TokenAddressMap = Readonly<{ [chainId in ChainId]: Readonly<{ [tokenAddress: string]: Token }> }>

/**
 * An empty result, useful as a default.
 */
const EMPTY_LIST: TokenAddressMap = {
  [ChainId.KOVAN]: {},
  [ChainId.RINKEBY]: {},
  [ChainId.ROPSTEN]: {},
  [ChainId.GÖRLI]: {},
  [ChainId.MAINNET]: {}
}

export function listToTokenMap(list: TokenList): TokenAddressMap {
  return list.tokens.reduce<TokenAddressMap>(
    (tokenMap, tokenInfo) => {
      const token = new Token(
        tokenInfo.chainId,
        tokenInfo.address,
        tokenInfo.decimals,
        tokenInfo.symbol,
        tokenInfo.name
      )
      if (tokenMap[token.chainId][token.address] !== undefined) throw Error('Duplicate tokens.')
      return {
        ...tokenMap,
        [token.chainId]: {
          ...tokenMap[token.chainId],
          [token.address]: token
        }
      }
    },
    { ...EMPTY_LIST }
  )
}

export function useTokenList(url: string): TokenAddressMap {
  const lists = useSelector<AppState, AppState['lists']['byUrl']>(state => state.lists.byUrl)
  return useMemo(() => {
    const current = lists[url]?.current
    if (!current) return EMPTY_LIST
    return listToTokenMap(current)
  }, [lists, url])
}

export const DEFAULT_TOKEN_LIST_URL =
  'https://unpkg.com/@uniswap/default-token-list@latest/uniswap-default.tokenlist.json'

export function useDefaultTokenList(): TokenAddressMap {
  return useTokenList(DEFAULT_TOKEN_LIST_URL)
}
