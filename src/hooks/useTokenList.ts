import { ChainId, Token } from '@uniswap/sdk'
import { TokenList } from '@uniswap/token-lists'
import { useEffect, useState } from 'react'
import { retry } from '../utils/retry'

const DEFAULT_TOKEN_LIST_URL = 'https://unpkg.com/@uniswap/default-token-list@latest/uniswap-default.tokenlist.json'
export type AllTokens = Readonly<{ [chainId in ChainId]: Readonly<{ [tokenAddress: string]: Token }> }>

const fetchCache: { [url: string]: Promise<TokenList> } = {}

function loadList(url: string): Promise<TokenList> {
  return (fetchCache[url] =
    fetchCache[url] ?? retry(() => fetch(url).then(res => res.json()), { n: Infinity, minWait: 10000 }))
}

const parsedListMap = new WeakMap<TokenList, AllTokens>()
const EMPTY_LIST: AllTokens = {
  [ChainId.KOVAN]: {},
  [ChainId.RINKEBY]: {},
  [ChainId.ROPSTEN]: {},
  [ChainId.GÖRLI]: {},
  [ChainId.MAINNET]: {}
}

function loadAndParseList(url: string): Promise<AllTokens> {
  return loadList(url).then(list => {
    const result = parsedListMap.get(list)
    if (result) {
      return result
    } else {
      try {
        const parsed = list.tokens.reduce<AllTokens>(
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
          {
            [ChainId.MAINNET]: {},
            [ChainId.RINKEBY]: {},
            [ChainId.GÖRLI]: {},
            [ChainId.ROPSTEN]: {},
            [ChainId.KOVAN]: {}
          }
        )
        parsedListMap.set(list, parsed)
        return parsed
      } catch (error) {
        console.error('Failed to parse list', url, error)
      }
      return EMPTY_LIST
    }
  })
}

export function useTokenList(url: string): AllTokens {
  const [tokenList, setTokenList] = useState<AllTokens | null>(null)
  useEffect(() => {
    let stale = false
    loadAndParseList(url).then(tokenList => {
      if (!stale) setTokenList(tokenList)
    })
    return () => {
      stale = true
    }
  }, [url])

  return tokenList ? tokenList : EMPTY_LIST
}

export function useDefaultTokenList(): AllTokens {
  return useTokenList(DEFAULT_TOKEN_LIST_URL)
}
