// Copied from https://github.com/Uniswap/interface/blob/main/src/state/lists/hooks.ts

import { TokenList } from '@uniswap/token-lists'
import { useMemo } from 'react'
import { useAppSelector } from 'src/app/hooks'
import { UNI_LIST, UNSUPPORTED_LIST_URLS } from 'src/constants/tokenLists/tokenLists'
import { ChainIdToListedTokens } from 'src/features/tokenLists/types'
import sortByListPriority from 'src/features/tokenLists/utils'
import { WrappedTokenInfo } from 'src/features/tokenLists/wrappedTokenInfo'
import { logger } from 'src/utils/logger'

const listCache: WeakMap<TokenList, ChainIdToListedTokens> | null =
  typeof WeakMap !== 'undefined' ? new WeakMap<TokenList, ChainIdToListedTokens>() : null

function listToTokenMap(list: TokenList): ChainIdToListedTokens {
  const result = listCache?.get(list)
  if (result) return result

  const map = list.tokens.reduce<ChainIdToListedTokens>((tokenMap, tokenInfo) => {
    const token = new WrappedTokenInfo(tokenInfo, list)
    if (tokenMap[token.chainId]?.[token.address] !== undefined) {
      logger.debug('tokenLists/hooks', 'listToTokenMap', `Duplicate token! ${token.address}`)
      return tokenMap
    }
    if (!tokenMap[token.chainId]) tokenMap[token.chainId] = {}
    tokenMap[token.chainId][token.address] = {
      token,
      list,
    }
    return tokenMap
  }, {}) as ChainIdToListedTokens
  listCache?.set(list, map)
  return map
}

export function useAllLists() {
  return useAppSelector((state) => state.tokenLists.byUrl)
}

/**
 * Combine the tokens in map2 with the tokens on map1, where tokens on map1 take precedence
 * @param map1 the base token map
 * @param map2 the map of additional tokens to add to the base map
 */
export function combineMaps(
  map1: ChainIdToListedTokens,
  map2: ChainIdToListedTokens
): ChainIdToListedTokens {
  const chainIds = Object.keys(
    Object.keys(map1)
      .concat(Object.keys(map2))
      .reduce<{ [chainId: string]: true }>((memo, value) => {
        memo[value] = true
        return memo
      }, {})
  ).map((id) => parseInt(id, 10))

  return chainIds.reduce<ChainIdToListedTokens>((memo, chainId) => {
    memo[chainId] = {
      ...map2[chainId],
      // map1 takes precedence
      ...map1[chainId],
    }
    return memo
  }, {}) as ChainIdToListedTokens
}

// merge tokens contained within lists from urls
function useCombinedTokenMapFromUrls(urls: string[] | undefined): ChainIdToListedTokens {
  const lists = useAllLists()

  return useMemo(() => {
    if (!urls) return {}
    return (
      urls
        .slice()
        // sort by priority so top priority goes last
        .sort(sortByListPriority)
        .reduce((allTokens, currentUrl) => {
          const current = lists[currentUrl]?.current
          if (!current) return allTokens
          try {
            return combineMaps(allTokens, listToTokenMap(current))
          } catch (error) {
            logger.error(
              'tokenLists/hooks',
              'useCombinedTokenMapFromUrls',
              'Could not show token list due to error',
              error
            )
            return allTokens
          }
        }, {})
    )
  }, [lists, urls])
}

// filter out unsupported lists
export function useActiveListUrls(): string[] | undefined {
  const activeUrls = useAppSelector((state) => state.tokenLists.activeListUrls)

  return useMemo(() => {
    return activeUrls?.filter((url) => !UNSUPPORTED_LIST_URLS.includes(url))
  }, [activeUrls])
}

export function useInactiveListUrls(): string[] {
  const lists = useAllLists()
  const allActiveListUrls = useActiveListUrls()
  return Object.keys(lists).filter(
    (url) => !allActiveListUrls?.includes(url) && !UNSUPPORTED_LIST_URLS.includes(url)
  )
}

// get all the tokens from active lists, combine with local default tokens
export function useCombinedActiveList(): ChainIdToListedTokens {
  const activeListUrls = useActiveListUrls()
  const activeTokens = useCombinedTokenMapFromUrls(activeListUrls)
  return activeTokens
}

// list of tokens not supported for various reasons, used to show warnings and prevent swaps
export function useUnsupportedTokenList(): ChainIdToListedTokens {
  // get dynamic list of unsupported tokens
  const loadedUnsupportedListMap = useCombinedTokenMapFromUrls(UNSUPPORTED_LIST_URLS)
  return loadedUnsupportedListMap
}

const ONLY_UNISWAP_LIST = [UNI_LIST]
export function useUniswapDefaultList(): ChainIdToListedTokens {
  return useCombinedTokenMapFromUrls(ONLY_UNISWAP_LIST)
}

export function useIsListActive(url: string): boolean {
  const activeListUrls = useActiveListUrls()
  return Boolean(activeListUrls?.includes(url))
}
