import { Currency, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { DEFAULT_INACTIVE_LIST_URLS } from 'constants/lists'
import { useCurrencyFromMap, useTokenFromMapOrNetwork } from 'lib/hooks/useCurrency'
import { getTokenFilter } from 'lib/hooks/useTokenList/filtering'
import { useMemo } from 'react'

import { useAllLists, useCombinedActiveList } from '../state/lists/hooks'
import { WrappedTokenInfo } from '../state/lists/wrappedTokenInfo'
import { useUserAddedTokens, useUserAddedTokensOnChain } from '../state/user/hooks'
import { TokenAddressMap, useUnsupportedTokenList } from './../state/lists/hooks'

// reduce token map into standard address <-> Token mapping, optionally include user added tokens
function useTokensFromMap(tokenMap: TokenAddressMap): { [address: string]: Token } {
  const { chainId } = useWeb3React()
  return useMemo(() => {
    if (!chainId) return {}

    // reduce to just tokens
    return Object.keys(tokenMap[chainId] ?? {}).reduce<{ [address: string]: Token }>((newMap, address) => {
      newMap[address] = tokenMap[chainId][address].token
      return newMap
    }, {})
  }, [chainId, tokenMap])
}

export function useAllTokens(): { [address: string]: Token } {
  const allTokens = useCombinedActiveList()
  const tokensFromMap = useTokensFromMap(allTokens)
  const userAddedTokens = useUserAddedTokens()
  return useMemo(() => {
    return (
      userAddedTokens
        // reduce into all ALL_TOKENS filtered by the current chain
        .reduce<{ [address: string]: Token }>(
          (tokenMap, token) => {
            tokenMap[token.address] = token
            return tokenMap
          },
          // must make a copy because reduce modifies the map, and we do not
          // want to make a copy in every iteration
          { ...tokensFromMap }
        )
    )
  }, [tokensFromMap, userAddedTokens])
}

export function useUnsupportedTokens(): { [address: string]: Token } {
  const unsupportedTokensMap = useUnsupportedTokenList()
  const unsupportedTokens = useTokensFromMap(unsupportedTokensMap)

  return { ...unsupportedTokens }
}

export function useSearchInactiveTokenLists(search: string | undefined, minResults = 10): WrappedTokenInfo[] {
  const lists = useAllLists()
  const inactiveUrls = DEFAULT_INACTIVE_LIST_URLS
  const { chainId } = useWeb3React()
  const activeTokens = useAllTokens()
  return useMemo(() => {
    if (!search || search.trim().length === 0) return []
    const tokenFilter = getTokenFilter(search)
    const result: WrappedTokenInfo[] = []
    const addressSet: { [address: string]: true } = {}
    for (const url of inactiveUrls) {
      const list = lists[url]?.current
      if (!list) continue
      for (const tokenInfo of list.tokens) {
        if (tokenInfo.chainId === chainId && tokenFilter(tokenInfo)) {
          try {
            const wrapped: WrappedTokenInfo = new WrappedTokenInfo(tokenInfo, list)
            if (!(wrapped.address in activeTokens) && !addressSet[wrapped.address]) {
              addressSet[wrapped.address] = true
              result.push(wrapped)
              if (result.length >= minResults) return result
            }
          } catch {
            continue
          }
        }
      }
    }
    return result
  }, [activeTokens, chainId, inactiveUrls, lists, minResults, search])
}

// Check if currency is included in custom list from user storage
export function useIsUserAddedToken(currency: Currency | undefined | null): boolean {
  const userAddedTokens = useUserAddedTokens()

  if (!currency) {
    return false
  }

  return !!userAddedTokens.find((token) => currency.equals(token))
}

// Check if currency on specific chain is included in custom list from user storage
export function useIsUserAddedTokenOnChain(
  address: string | undefined | null,
  chain: number | undefined | null
): boolean {
  const userAddedTokens = useUserAddedTokensOnChain(chain)

  if (!address || !chain) {
    return false
  }

  return !!userAddedTokens.find((token) => token.address === address)
}

// undefined if invalid or does not exist
// null if loading or null was passed
// otherwise returns the token
export function useToken(tokenAddress?: string | null): Token | null | undefined {
  const tokens = useAllTokens()
  return useTokenFromMapOrNetwork(tokens, tokenAddress)
}

export function useCurrency(currencyId?: string | null): Currency | null | undefined {
  const tokens = useAllTokens()
  return useCurrencyFromMap(tokens, currencyId)
}
