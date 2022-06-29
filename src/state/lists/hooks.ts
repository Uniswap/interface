import { ChainId } from '@kyberswap/ks-sdk-core'
import { Tags, TokenList } from '@uniswap/token-lists'
import DEFAULT_TOKEN_LIST from '@uniswap/default-token-list'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { AppState } from '../index'
import { UNSUPPORTED_LIST_URLS } from '../../constants/lists'
import { useActiveWeb3React } from 'hooks'
import sortByListPriority from 'utils/listSort'
import UNSUPPORTED_TOKEN_LIST from '../../constants/tokenLists/uniswap-v2-unsupported.tokenlist.json'
import { WrappedTokenInfo } from './wrappedTokenInfo'
import { NETWORKS_INFO, SUPPORTED_NETWORKS } from 'constants/networks'

type TagDetails = Tags[keyof Tags]
export interface TagInfo extends TagDetails {
  id: string
}

type Mutable<T> = {
  -readonly [P in keyof T]: Mutable<T[P]>
}

export type TokenAddressMap = Readonly<
  { [chainId in ChainId | number]: Readonly<{ [tokenAddress: string]: { token: WrappedTokenInfo; list: TokenList } }> }
>

/**
 * An empty result, useful as a default.
 */
export const EMPTY_LIST: TokenAddressMap = SUPPORTED_NETWORKS.reduce((acc, val) => {
  acc[val] = {}
  return acc
}, {} as { [chainId in ChainId]: { [tokenAddress: string]: { token: WrappedTokenInfo; list: TokenList } } })

const listCache: WeakMap<TokenList, TokenAddressMap> | null =
  typeof WeakMap !== 'undefined' ? new WeakMap<TokenList, TokenAddressMap>() : null

function listToTokenMap(list: TokenList): TokenAddressMap {
  const result = listCache?.get(list)
  if (result) return result

  const map = list.tokens.reduce<TokenAddressMap>(
    (tokenMap, tokenInfo) => {
      const token = new WrappedTokenInfo(tokenInfo, list)
      if (tokenMap[token.chainId][token.address] !== undefined) {
        console.error(new Error(`Duplicate token! ${token.address}`))
        return tokenMap
      }
      return {
        ...tokenMap,
        [token.chainId]: {
          ...tokenMap[token.chainId as ChainId],
          [token.address]: {
            token,
            list: list,
          },
        },
      }
    },
    { ...EMPTY_LIST },
  )

  listCache?.set(list, map)
  return map
}

const TRANSFORMED_DEFAULT_TOKEN_LIST = listToTokenMap(DEFAULT_TOKEN_LIST)

// returns all downloaded current lists
export function useAllLists(): {
  readonly [url: string]: {
    readonly current: TokenList | null
    readonly pendingUpdate: TokenList | null
    readonly loadingRequestId: string | null
    readonly error: string | null
  }
} {
  return useSelector<AppState, AppState['lists']['byUrl']>(state => state.lists.byUrl)
}

export function useAllListsByChainId(): {
  readonly [url: string]: {
    readonly current: TokenList | null
    readonly pendingUpdate: TokenList | null
    readonly loadingRequestId: string | null
    readonly error: string | null
  }
} {
  const { chainId } = useActiveWeb3React()

  const allLists = useAllLists()

  const INITIAL_LISTS: {
    [url: string]: {
      readonly current: TokenList | null
      readonly pendingUpdate: TokenList | null
      readonly loadingRequestId: string | null
      readonly error: string | null
    }
  } = {}

  const lists = Object.keys(allLists)
    .filter(list => allLists[list].current?.tokens.some?.(i => i.chainId === chainId))
    .reduce((obj, key) => {
      obj[key] = allLists[key]
      return obj
    }, INITIAL_LISTS)

  return lists
}

export function combineMaps(map1: TokenAddressMap, map2: TokenAddressMap): TokenAddressMap {
  const chainIds = Object.keys(
    Object.keys(map1)
      .concat(Object.keys(map2))
      .reduce<{ [chainId: string]: true }>((memo, value) => {
        memo[value] = true
        return memo
      }, {}),
  ).map(id => parseInt(id))

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
    if (!urls) return EMPTY_LIST
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
            console.error('Could not show token list due to error', error)
            return allTokens
          }
        }, EMPTY_LIST)
    )
  }, [lists, urls])
}

// filter out unsupported lists
export function useActiveListUrls(): string[] | undefined {
  const activeListUrls = useSelector<AppState, AppState['lists']['activeListUrls']>(state => state.lists.activeListUrls)

  return useMemo(() => {
    return activeListUrls?.filter((url: string) => !UNSUPPORTED_LIST_URLS.includes(url))
  }, [activeListUrls])
}

export function useInactiveListUrls(): string[] {
  const lists = useAllLists()
  const allActiveListUrls = useActiveListUrls()

  return useMemo(
    () => Object.keys(lists).filter(url => !allActiveListUrls?.includes(url) && !UNSUPPORTED_LIST_URLS.includes(url)),
    [lists, allActiveListUrls],
  )
}

function useDMMTokenList(): TokenAddressMap {
  const { chainId } = useActiveWeb3React()
  const lists = useAllLists()

  return useMemo(() => {
    const list = lists[NETWORKS_INFO[chainId || ChainId.MAINNET].tokenListUrl].current
    return list ? listToTokenMap(list) : {}
  }, [chainId, lists])
}

function useDefaultTokenList(): TokenAddressMap {
  const dmmTokens = useDMMTokenList()

  return useMemo(() => {
    return combineMaps(dmmTokens, TRANSFORMED_DEFAULT_TOKEN_LIST)
  }, [dmmTokens])
}

// get all the tokens from active lists, combine with local default tokens
export function useCombinedActiveList(): TokenAddressMap {
  const activeListUrls = useActiveListUrls()
  const activeTokens = useCombinedTokenMapFromUrls(activeListUrls)
  const defaultTokens = useDefaultTokenList()

  return useMemo(() => {
    return combineMaps(activeTokens, defaultTokens)
  }, [activeTokens, defaultTokens])
}

// list of tokens not supported on interface, used to show warnings and prevent swaps and adds
export function useUnsupportedTokenList(): TokenAddressMap {
  // get hard coded unsupported tokens
  const localUnsupportedListMap = listToTokenMap(UNSUPPORTED_TOKEN_LIST)

  // get any loaded unsupported tokens
  const loadedUnsupportedListMap = useCombinedTokenMapFromUrls(UNSUPPORTED_LIST_URLS)

  // format into one token address map
  return useMemo(() => {
    return combineMaps(localUnsupportedListMap, loadedUnsupportedListMap)
  }, [localUnsupportedListMap, loadedUnsupportedListMap])
}

export function useIsListActive(url: string): boolean {
  const activeListUrls = useActiveListUrls()

  return Boolean(activeListUrls?.includes(url))
}
