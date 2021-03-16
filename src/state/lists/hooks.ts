import { ChainId, Token } from '@fuseio/fuse-swap-sdk'
import { Tags, TokenInfo, TokenList } from '@fuseio/token-lists'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { AppState } from '../index'
import { unwrapOrThrow } from '../../utils'

const BINANCE_CHAIN_ID = unwrapOrThrow('BINANCE_CHAIN_ID')

type TagDetails = Tags[keyof Tags]
export interface TagInfo extends TagDetails {
  id: string
}

export interface Info extends TokenInfo {
  isMultiBridge: boolean
  isDeprecated: boolean
}

/**
 * Token instances created from token info.
 */
export class WrappedTokenInfo extends Token {
  public readonly tokenInfo: any
  public readonly tags: TagInfo[]
  constructor(tokenInfo: any, tags: TagInfo[]) {
    super(tokenInfo.chainId, tokenInfo.address, tokenInfo.decimals, tokenInfo.symbol, tokenInfo.name)
    this.tokenInfo = tokenInfo
    this.tags = tags
  }
  public get logoURI(): string | undefined {
    return this.tokenInfo.logoURI
  }
  public get isDeprecated(): boolean {
    return Boolean(this.tokenInfo.isDeprecated)
  }
}

export type TokenAddressMap = Readonly<any>

/**
 * An empty result, useful as a default.
 */
const EMPTY_LIST: TokenAddressMap = {
  [ChainId.KOVAN]: {},
  [ChainId.RINKEBY]: {},
  [ChainId.ROPSTEN]: {},
  [ChainId.GÖRLI]: {},
  [ChainId.MAINNET]: {},
  [ChainId.FUSE]: {},
  [BINANCE_CHAIN_ID]: {}
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
          [token.address]: token
        }
      }
    },
    { ...EMPTY_LIST }
  )
  listCache?.set(list, map)
  return map
}

export function useSwapTokenList(url: string | undefined): TokenAddressMap {
  const lists = useSelector<AppState, AppState['lists']['Swap']['byUrl']>(state => state.lists.Swap.byUrl)
  return useMemo(() => {
    if (!url) return EMPTY_LIST
    const current = lists[url]?.current
    if (!current) return EMPTY_LIST
    try {
      return listToTokenMap(current)
    } catch (error) {
      console.error('Could not show token list due to error', error)
      return EMPTY_LIST
    }
  }, [lists, url])
}

export function useBridgeTokenList(url: string | undefined): TokenAddressMap {
  const lists = useSelector<AppState, AppState['lists']['Bridge']['byUrl']>(state => state.lists.Bridge.byUrl)
  return useMemo(() => {
    if (!url) return EMPTY_LIST
    const current = lists[url]?.current
    if (!current) return EMPTY_LIST
    try {
      return listToTokenMap(current)
    } catch (error) {
      console.error('Could not show token list due to error', error)
      return EMPTY_LIST
    }
  }, [lists, url])
}

export function useSelectedSwapListUrl(): string | undefined {
  return useSelector<AppState, AppState['lists']['Swap']['selectedListUrl']>(state => state.lists.Swap.selectedListUrl)
}

export function useSelectedBridgeListUrl(): string | undefined {
  return useSelector<AppState, AppState['lists']['Bridge']['selectedListUrl']>(
    state => state.lists.Bridge.selectedListUrl
  )
}

export function useSelectedSwapTokenList(): TokenAddressMap {
  return useSwapTokenList(useSelectedSwapListUrl())
}

export function useSelectedBridgeTokenList(): TokenAddressMap {
  return useBridgeTokenList(useSelectedBridgeListUrl())
}

export function useSelectedSwapListInfo(): { current: TokenList | null; pending: TokenList | null; loading: boolean } {
  const selectedUrl = useSelectedSwapListUrl()
  const listsByUrl = useSelector<AppState, AppState['lists']['Swap']['byUrl']>(state => state.lists.Swap.byUrl)
  const list = selectedUrl ? listsByUrl[selectedUrl] : undefined
  return {
    current: list?.current ?? null,
    pending: list?.pendingUpdate ?? null,
    loading: list?.loadingRequestId !== null
  }
}

export function useSelectedBridgeListInfo(): {
  current: TokenList | null
  pending: TokenList | null
  loading: boolean
} {
  const selectedUrl = useSelectedBridgeListUrl()
  const listsByUrl = useSelector<AppState, AppState['lists']['Bridge']['byUrl']>(state => state.lists.Bridge.byUrl)
  const list = selectedUrl ? listsByUrl[selectedUrl] : undefined
  return {
    current: list?.current ?? null,
    pending: list?.pendingUpdate ?? null,
    loading: list?.loadingRequestId !== null
  }
}

// returns all downloaded current lists
export function useAllSwapLists(): TokenList[] {
  const lists = useSelector<AppState, AppState['lists']['Swap']['byUrl']>(state => state.lists.Swap.byUrl)

  return useMemo(
    () =>
      Object.keys(lists)
        .map(url => lists[url].current)
        .filter((l): l is TokenList => Boolean(l)),
    [lists]
  )
}

export function useAllBridgeLists(): TokenList[] {
  const lists = useSelector<AppState, AppState['lists']['Bridge']['byUrl']>(state => state.lists.Bridge.byUrl)

  return useMemo(
    () =>
      Object.keys(lists)
        .map(url => lists[url].current)
        .filter((l): l is TokenList => Boolean(l)),
    [lists]
  )
}
