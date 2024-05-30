import { TokenAddressMap, tokensToChainTokenMap } from 'lib/hooks/useTokenList/utils'
import { useAppSelector } from 'state/hooks'
import { AppState } from 'state/reducer'

import { DEFAULT_INACTIVE_LIST_URLS } from 'constants/lists'
import { useMemo } from 'react'

type Mutable<T> = {
  -readonly [P in keyof T]: Mutable<T[P]>
}

export function useAllLists(): AppState['lists']['byUrl'] {
  return useAppSelector((state) => state.lists.byUrl)
}

/**
 * Combine the tokens in map2 with the tokens on map1, where tokens on map1 take precedence
 * @param map1 the base token map
 * @param map2 the map of additioanl tokens to add to the base map
 */
function combineMaps(map1: TokenAddressMap, map2: TokenAddressMap): TokenAddressMap {
  const chainIds = Object.keys(
    Object.keys(map1)
      .concat(Object.keys(map2))
      .reduce<{ [chainId: string]: true }>((memo, value) => {
        memo[value] = true
        return memo
      }, {})
  ).map((id) => parseInt(id))

  return chainIds.reduce<Mutable<TokenAddressMap>>((memo, chainId) => {
    memo[chainId] = {
      ...map2[chainId],
      // map1 takes precedence
      ...map1[chainId],
    }
    return memo
  }, {}) as TokenAddressMap
}

// merge tokens contained within lists from urls
function useCombinedTokenMapFromUrls(urls: string[] | undefined): TokenAddressMap {
  const lists = useAllLists()
  return useMemo(() => {
    if (!urls) return {}
    return urls.slice().reduce((allTokens, currentUrl) => {
      const current = lists?.[currentUrl]?.current
      if (!current) return allTokens
      try {
        return combineMaps(allTokens, tokensToChainTokenMap(current))
      } catch (error) {
        console.error('Could not show token list due to error', error)
        return allTokens
      }
    }, {})
  }, [lists, urls])
}

// get all the tokens from active lists, combine with local default tokens
export function useCombinedInactiveLists(): TokenAddressMap {
  const inactiveTokens = useCombinedTokenMapFromUrls(DEFAULT_INACTIVE_LIST_URLS)
  return inactiveTokens
}
