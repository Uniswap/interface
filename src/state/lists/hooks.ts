import { TokenList } from '@uniswap/token-lists'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import sortByListPriority from '../../utils/listSort'
import UNSUPPORTED_TOKEN_LIST from '../../constants/tokenLists/swapr-unsupported.tokenlist.json'
import { AppState } from '../index'
import { UNSUPPORTED_LIST_URLS } from '../../constants/lists'
import { WrappedTokenInfo } from './wrapped-token-info'
import { ChainId } from 'dxswap-sdk'
import { useActiveWeb3React } from '../../hooks'

export type TokenAddressMap = Readonly<{
  [chainId: number]: Readonly<{ [tokenAddress: string]: { token: WrappedTokenInfo; list: TokenList } }>
}>

const listCache: WeakMap<TokenList, TokenAddressMap> | null =
  typeof WeakMap !== 'undefined' ? new WeakMap<TokenList, TokenAddressMap>() : null

export function listToTokenMap(list: TokenList | null): TokenAddressMap {
  if (!list) return {}
  const result = listCache?.get(list)
  if (result) return result

  const map = list.tokens.reduce<TokenAddressMap>((tokenMap, tokenInfo) => {
    const token = new WrappedTokenInfo(tokenInfo, list)
    if (tokenMap[token.chainId]?.[token.address] !== undefined) {
      console.error(new Error(`Duplicate token! ${token.address}`))
      return tokenMap
    }
    return {
      ...tokenMap,
      [token.chainId]: {
        ...tokenMap[token.chainId],
        [token.address]: {
          token,
          list
        }
      }
    }
  }, {})
  listCache?.set(list, map)
  return map
}

export function useAllLists(): AppState['lists']['byUrl'] {
  return useSelector<AppState, AppState['lists']['byUrl']>(state => state.lists.byUrl)
}

function combineMaps(map1: TokenAddressMap, map2: TokenAddressMap): TokenAddressMap {
  return {
    [ChainId.MAINNET]: { ...map1[ChainId.MAINNET], ...map2[ChainId.MAINNET] },
    [ChainId.RINKEBY]: { ...map1[ChainId.RINKEBY], ...map2[ChainId.RINKEBY] },
    [ChainId.XDAI]: { ...map1[ChainId.XDAI], ...map2[ChainId.XDAI] },
    [ChainId.ARBITRUM_ONE]: { ...map1[ChainId.ARBITRUM_ONE], ...map2[ChainId.ARBITRUM_ONE] },
    [ChainId.ARBITRUM_RINKEBY]: { ...map1[ChainId.ARBITRUM_RINKEBY], ...map2[ChainId.ARBITRUM_RINKEBY] }
  }
}

// merge tokens contained within lists from urls
function useCombinedTokenMapFromUrls(urls: string[] | undefined): TokenAddressMap {
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
            console.error('Could not show token list due to error', error)
            return allTokens
          }
        }, {})
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

export function useCombinedActiveList(): TokenAddressMap {
  const activeListUrls = useActiveListUrls()
  return useCombinedTokenMapFromUrls(activeListUrls)
}

export function useAllTokensFromActiveListsOnCurrentChain(): Readonly<{
  [tokenAddress: string]: { token: WrappedTokenInfo; list: TokenList }
}> {
  const { chainId } = useActiveWeb3React()
  const activeListUrls = useActiveListUrls()
  const combinedList = useCombinedTokenMapFromUrls(activeListUrls)
  return useMemo(() => combinedList[chainId || ChainId.MAINNET], [chainId, combinedList])
}

// list of tokens not supported on interface, used to show warnings and prevent swaps and adds
export function useUnsupportedTokenList(): TokenAddressMap {
  // get hard coded unsupported tokens
  const localUnsupportedListMap = listToTokenMap(UNSUPPORTED_TOKEN_LIST)

  // get any loaded unsupported tokens
  const loadedUnsupportedListMap = useCombinedTokenMapFromUrls(UNSUPPORTED_LIST_URLS)

  // format into one token address map
  return useMemo(() => combineMaps(localUnsupportedListMap, loadedUnsupportedListMap), [
    localUnsupportedListMap,
    loadedUnsupportedListMap
  ])
}

export function useIsListActive(url: string): boolean {
  const activeListUrls = useActiveListUrls()
  return Boolean(activeListUrls?.includes(url))
}
