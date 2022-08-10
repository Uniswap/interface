import { ChainId } from '@kyberswap/ks-sdk-core'
import { Tags, TokenList } from '@uniswap/token-lists'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'

import { NETWORKS_INFO, SUPPORTED_NETWORKS } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import useDebounce from 'hooks/useDebounce'
import sortByListPriority from 'utils/listSort'

import { UNSUPPORTED_LIST_URLS } from '../../constants/lists'
import UNSUPPORTED_TOKEN_LIST from '../../constants/tokenLists/uniswap-v2-unsupported.tokenlist.json'
import { AppState } from '../index'
import { WrappedTokenInfo } from './wrappedTokenInfo'

type TagDetails = Tags[keyof Tags]
export interface TagInfo extends TagDetails {
  id: string
}

type Mutable<T> = {
  -readonly [P in keyof T]: Mutable<T[P]>
}

export type TokenAddressMap = Readonly<{
  [chainId in ChainId | number]: Readonly<{ [tokenAddress: string]: WrappedTokenInfo }>
}>

export type TokenAddressMapWriteable = {
  [chainId in ChainId | number]: { [tokenAddress: string]: WrappedTokenInfo }
}

/**
 * An empty result, useful as a default.
 */
export const EMPTY_LIST: () => TokenAddressMapWriteable = () =>
  SUPPORTED_NETWORKS.reduce((acc, val) => {
    acc[val] = {}
    return acc
  }, {} as { [chainId in ChainId]: { [tokenAddress: string]: WrappedTokenInfo } })

const listCache: { [list: string]: TokenAddressMap } = {}

const serializeList = (list: TokenList): string => {
  return list.tokens
    .slice(0, 5)
    .map(token => token.address)
    .join('')
}

function listToTokenMap(list: TokenList): TokenAddressMap {
  const serializedList = serializeList(list)
  const result = listCache[serializedList]
  if (result) return result

  const map = list.tokens.reduce<TokenAddressMapWriteable>(
    (tokenMap, tokenInfo) => {
      if (tokenMap[tokenInfo.chainId][tokenInfo.address] !== undefined) {
        return tokenMap
      }
      const token = new WrappedTokenInfo(tokenInfo, list)
      tokenMap[tokenInfo.chainId][tokenInfo.address] = token
      return tokenMap
    },
    { ...EMPTY_LIST() },
  )

  listCache[serializedList] = map
  return map
}

// returns all downloaded current lists
export type ListType = {
  readonly [url: string]: {
    readonly current: TokenList | null
    readonly pendingUpdate: TokenList | null
    readonly loadingRequestId: string | null
    readonly error: string | null
  }
}

export function useAllLists(): ListType {
  const lists = useSelector<AppState, AppState['lists']['byUrl']>(state => state.lists.byUrl)
  const debouncedLists = useDebounce(lists, 1000)
  return debouncedLists
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

function combine2Maps(map1: TokenAddressMap, map2: TokenAddressMap): TokenAddressMap {
  const chainIds = [...new Set([...Object.keys(map1), ...Object.keys(map2)])].map(id => parseInt(id) as ChainId)

  return chainIds.reduce<Mutable<TokenAddressMap>>((memo, chainId) => {
    memo[chainId] = {
      ...map2[chainId],
      // map1 takes precedence
      ...map1[chainId],
    }
    return memo
  }, {}) as TokenAddressMap
}

function combineMultipleMaps(maps: TokenAddressMap[]): TokenAddressMap | null {
  if (maps.length === 0) return null
  if (maps.length === 1) return maps[0]
  const chainIdSet = new Set()
  maps.forEach(map => Object.keys(map).forEach(chainId => chainIdSet.add(chainId)))
  const chainIds: ChainId[] = [...chainIdSet].map(Number)

  return chainIds.reduce<Mutable<TokenAddressMap>>((memo, chainId) => {
    memo[chainId] = {}
    maps.reverse().forEach(map => Object.assign(memo[chainId], map[chainId]))
    return memo
  }, {}) as TokenAddressMap
}

// merge tokens contained within lists from urls
function useCombinedTokenMapFromUrls(urls: string[] | undefined): TokenAddressMap {
  const lists = useAllLists()
  const filteredUrls = useMemo(
    () =>
      urls
        ?.filter(url => lists[url]?.current)
        // sort by priority so top priority goes last
        .sort(sortByListPriority),
    [lists, urls],
  )

  return useMemo(() => {
    if (!filteredUrls) return EMPTY_LIST()
    // we have already filtered out nullish values above => lists[url]?.current is truthy value
    // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain, @typescript-eslint/no-non-null-assertion
    return combineMultipleMaps([EMPTY_LIST(), ...filteredUrls.map(url => listToTokenMap(lists[url]?.current!))])!
  }, [filteredUrls, lists])
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
  return dmmTokens
}

// get all the tokens from active lists, combine with local default tokens
export function useCombinedActiveList(): TokenAddressMap {
  const activeListUrls = useActiveListUrls()
  const activeTokens = useCombinedTokenMapFromUrls(activeListUrls)
  const defaultTokens = useDefaultTokenList()

  return useMemo(() => {
    return combine2Maps(activeTokens, defaultTokens)
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
    return combine2Maps(localUnsupportedListMap, loadedUnsupportedListMap)
  }, [localUnsupportedListMap, loadedUnsupportedListMap])
}

export function useIsListActive(url: string): boolean {
  const activeListUrls = useActiveListUrls()

  return Boolean(activeListUrls?.includes(url))
}
