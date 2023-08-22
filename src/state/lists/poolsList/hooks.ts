import { TokenAddressMap, tokensToChainTokenMap } from 'lib/hooks/useTokenList/utils'
import { useMemo } from 'react'
import { useAppSelector } from 'state/hooks'
import { AppState } from 'state/reducer'

type Mutable<T> = {
  -readonly [P in keyof T]: Mutable<T[P]>
}

export function usePoolsList(): AppState['poolsList']['byUrl'] {
  return useAppSelector((state) => state.poolsList.byUrl)
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

export function usePoolMapFromUrl(urls: string[] | undefined): TokenAddressMap {
  const lists = usePoolsList()
  return useMemo(() => {
    if (!urls) return {}
    return urls.slice().reduce((allTokens, currentUrl) => {
      const current = lists[currentUrl]?.current
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

// TODO: define TokenInfo | undefined returned type
export function usePoolsFromUrl(urls: string[] | undefined, chainId: number | undefined) {
  const lists = usePoolsList()
  return useMemo(() => {
    if (!urls) return []
    return lists[urls[0]]?.current?.tokens?.filter((n) => n.chainId === chainId)
  }, [lists, urls, chainId])
}
