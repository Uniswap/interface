import { UNSUPPORTED_LIST_URLS, LOCAL_UNSUPPORTED_LISTS } from './../../constants/lists'
import { DEFAULT_TOKEN_LIST_URL } from 'constants/lists'
import { ChainId, Token } from '@uniswap/sdk'
import { Tags, TokenInfo, TokenList } from '@uniswap/token-lists'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { AppState } from '../index'
import sortByListPriority from 'utils/listSort'

type TagDetails = Tags[keyof Tags]
export interface TagInfo extends TagDetails {
  id: string
}

/**
 * Token instances created from token info.
 */
export class WrappedTokenInfo extends Token {
  public readonly tokenInfo: TokenInfo
  public readonly tags: TagInfo[]
  constructor(tokenInfo: TokenInfo, tags: TagInfo[]) {
    super(tokenInfo.chainId, tokenInfo.address, tokenInfo.decimals, tokenInfo.symbol, tokenInfo.name)
    this.tokenInfo = tokenInfo
    this.tags = tags
  }
  public get logoURI(): string | undefined {
    return this.tokenInfo.logoURI
  }
}

export type TokenAddressMap = Readonly<
  { [chainId in ChainId]: Readonly<{ [tokenAddress: string]: { token: WrappedTokenInfo; list: TokenList } }> }
>

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

const listCache: WeakMap<TokenList, TokenAddressMap> | null =
  typeof WeakMap !== 'undefined' ? new WeakMap<TokenList, TokenAddressMap>() : null

export function listToTokenMap(list: TokenList): TokenAddressMap {
  const result = listCache?.get(list)
  if (result) return result

  const map = list.tokens.reduce<TokenAddressMap>(
    (tokenMap, tokenInfo) => {
      const tags: TagInfo[] =
        tokenInfo.tags
          ?.map(tagId => {
            if (!list.tags?.[tagId]) return undefined
            return { ...list.tags[tagId], id: tagId }
          })
          ?.filter((x): x is TagInfo => Boolean(x)) ?? []
      const token = new WrappedTokenInfo(tokenInfo, tags)
      if (tokenMap[token.chainId][token.address] !== undefined) throw Error('Duplicate tokens.')
      return {
        ...tokenMap,
        [token.chainId]: {
          ...tokenMap[token.chainId],
          [token.address]: {
            token,
            list: list
          }
        }
      }
    },
    { ...EMPTY_LIST }
  )
  listCache?.set(list, map)
  return map
}

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

// used for combining
function useCombinedMapFromLists(tokenLists: TokenList[]): TokenAddressMap {
  return useMemo(() => {
    return tokenLists.reduce((allTokens, current) => {
      if (!current) return allTokens
      try {
        const newTokens = Object.assign(listToTokenMap(current))
        return {
          1: { ...allTokens[1], ...newTokens[1] },
          3: { ...allTokens[3], ...newTokens[3] },
          4: { ...allTokens[4], ...newTokens[4] },
          5: { ...allTokens[5], ...newTokens[5] },
          42: { ...allTokens[42], ...newTokens[42] }
        }
      } catch (error) {
        console.error('Could not show token list due to error', error)
        return allTokens
      }
    }, EMPTY_LIST)
  }, [tokenLists])
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
            const newTokens = Object.assign(listToTokenMap(current))
            return {
              1: { ...allTokens[1], ...newTokens[1] },
              3: { ...allTokens[3], ...newTokens[3] },
              4: { ...allTokens[4], ...newTokens[4] },
              5: { ...allTokens[5], ...newTokens[5] },
              42: { ...allTokens[42], ...newTokens[42] }
            }
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
  return useSelector<AppState, AppState['lists']['activeListUrls']>(state => state.lists.activeListUrls)?.filter(
    url => !UNSUPPORTED_LIST_URLS.includes(url)
  )
}

export function useInactiveListUrls(): string[] {
  const lists = useAllLists()
  const allActiveListUrls = useActiveListUrls()
  return Object.keys(lists).filter(url => !allActiveListUrls?.includes(url) && !UNSUPPORTED_LIST_URLS.includes(url))
}

// all tokens from inactive lists
export function useCombinedInactiveList(): TokenAddressMap {
  const allInactiveListUrls: string[] = useInactiveListUrls()
  return useCombinedTokenMapFromUrls(allInactiveListUrls)
}

// get all the tokens from active lists
export function useCombinedActiveList(): TokenAddressMap {
  const activeListUrls = useActiveListUrls()
  return useCombinedTokenMapFromUrls(activeListUrls)
}

export function useIsListActive(url: string): boolean {
  const activeListUrls = useActiveListUrls()
  return Boolean(activeListUrls?.includes(url))
}

export function useDefaultTokenList(): TokenAddressMap {
  return useCombinedTokenMapFromUrls([DEFAULT_TOKEN_LIST_URL])
}

export function useUnsupportedTokenList(): TokenAddressMap {
  // get all hosted unsupported lists that have loaded
  const allLists = useAllLists()
  const listFromUrlsMap = UNSUPPORTED_LIST_URLS.map(url => {
    return allLists[url].current
  })
  const loadedLists: TokenList[] = listFromUrlsMap.filter((x): x is TokenList => Boolean(x))

  // combined with local lists
  loadedLists.push(...LOCAL_UNSUPPORTED_LISTS)

  // format into token address map
  return useCombinedMapFromLists(loadedLists)
}
