import { Token } from '@uniswap/sdk-core'
import { TokenInfo, TokenList } from '@uniswap/token-lists'
import { FEWTOKEN_DEFAULT_ACTIVE_LIST_URLS, RING_DEFAULT_ACTIVE_LIST_URLS } from 'constants/lists'
import { useMemo } from 'react'
import { useAppSelector } from 'state/hooks'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { InterfaceState } from 'state/webReducer'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

export function useAllLists(): InterfaceState['lists']['byUrl'] {
  return useAppSelector((state) => state.lists.byUrl)
}

type Mutable<T> = {
  -readonly [P in keyof T]: Mutable<T[P]>
}

// reduce token map into standard address <-> Token mapping, optionally include user added tokens
function useTokensFromMap(tokenMap: TokenAddressMap, chainId: Maybe<UniverseChainId>): { [address: string]: Token } {
  return useMemo(() => {
    if (!chainId) {
      return {}
    }

    // reduce to just tokens
    return Object.keys(tokenMap[chainId] ?? {}).reduce<{ [address: string]: Token }>((newMap, address) => {
      newMap[address] = tokenMap[chainId][address].token
      return newMap
    }, {})
  }, [chainId, tokenMap])
}

const mapCache = typeof WeakMap !== 'undefined' ? new WeakMap<TokenList | TokenInfo[], TokenAddressMap>() : null

function tokensToChainTokenMap(tokens: TokenList | TokenInfo[]): TokenAddressMap {
  const cached = mapCache?.get(tokens)
  if (cached) {
    return cached
  }

  const [list, infos] = Array.isArray(tokens) ? [undefined, tokens] : [tokens, tokens.tokens]
  const map = infos.reduce<Mutable<TokenAddressMap>>((map, info) => {
    try {
      const token = new WrappedTokenInfo(info, list)
      if (map[token.chainId]?.[token.address] !== undefined) {
        // console.warn(`Duplicate token skipped: ${token.address}`)
        return map
      }
      if (!map[token.chainId]) {
        map[token.chainId] = {}
      }
      map[token.chainId][token.address] = { token, list }
      return map
    } catch {
      return map
    }
  }, {}) as TokenAddressMap
  mapCache?.set(tokens, map)
  return map
}

type TokenMap = Readonly<{ [tokenAddress: string]: { token: WrappedTokenInfo; list?: TokenList } }>
// TODO(WEB-2347): replace usage of the misnomered TokenAddressMap w/ ChainTokenMap from src/hooks/Tokens.ts
type TokenAddressMap = Readonly<{ [chainId: number]: TokenMap }>

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
      }, {}),
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
    if (!urls) {
      return {}
    }
    return (
      urls
        .slice()
        // sort by priority so top priority goes last
        .reduce((allTokens, currentUrl) => {
          const current = lists[currentUrl]?.current
          if (!current) {
            return allTokens
          }
          try {
            return combineMaps(allTokens, tokensToChainTokenMap(current))
          } catch (error) {
            // console.error('Could not show token list due to error', error)
            return allTokens
          }
        }, {})
    )
  }, [lists, urls])
}

function useRingCombinedActiveList(): TokenAddressMap {
  const activeTokens = useCombinedTokenMapFromUrls(RING_DEFAULT_ACTIVE_LIST_URLS)
  return activeTokens
}

function useFewTokenCombinedActiveList(): TokenAddressMap {
  const activeTokens = useCombinedTokenMapFromUrls(FEWTOKEN_DEFAULT_ACTIVE_LIST_URLS)
  return activeTokens
}

/** Returns all tokens from the default list + user added tokens */
export function useDefaultRingActiveTokens(chainId: Maybe<UniverseChainId>): { [address: string]: Token } {
  const defaultListTokens = useRingCombinedActiveList()
  const tokensFromMap = useTokensFromMap(defaultListTokens, chainId)

  return tokensFromMap
}

export function useDefaultFewTokenActiveTokensForChainIds(chainIds?: UniverseChainId[]): Token[] {
  const tokenMap = useFewTokenCombinedActiveList()

  return useMemo(() => {
    if (!chainIds?.length) {
      return Object.values(tokenMap).flatMap((tokensByAddress) =>
        Object.values(tokensByAddress).map(({ token }) => token),
      )
    }

    return chainIds.flatMap((chainId) => Object.values(tokenMap[chainId] ?? {}).map(({ token }) => token))
  }, [chainIds, tokenMap])
}
