import { ChainId, Token } from '@dynamic-amm/sdk'
import { Tags, TokenInfo, TokenList } from '@uniswap/token-lists'
import DEFAULT_TOKEN_LIST from '@uniswap/default-token-list'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { AppState } from '../index'
import { AVAX_TOKEN_LISTS, BSC_TOKEN_LISTS, MATIC_TOKEN_LISTS, UNSUPPORTED_LIST_URLS } from '../../constants/lists'
import { ROPSTEN_TOKEN_LIST } from '../../constants/tokenLists/ropsten.tokenlist'
import { MAINNET_TOKEN_LIST } from '../../constants/tokenLists/mainnet.tokenlist'
import { MATIC_TOKEN_LIST } from '../../constants/tokenLists/matic.tokenlist'
import { MUMBAI_TOKEN_LIST } from '../../constants/tokenLists/mumbai.tokenlist'
import { BSC_TESTNET_TOKEN_LIST } from '../../constants/tokenLists/bsc.testnet.tokenlist'
import { BSC_MAINNET_TOKEN_LIST } from '../../constants/tokenLists/bsc.mainnet.tokenlist'
import { AVAX_TESTNET_TOKEN_LIST } from '../../constants/tokenLists/avax.testnet.tokenlist'
import { AVAX_MAINNET_TOKEN_LIST } from '../../constants/tokenLists/avax.mainnet.tokenlist'
import { useActiveWeb3React } from 'hooks'
import sortByListPriority from 'utils/listSort'
import UNSUPPORTED_TOKEN_LIST from '../../constants/tokenLists/uniswap-v2-unsupported.tokenlist.json'

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
  { [chainId in ChainId | number]: Readonly<{ [tokenAddress: string]: { token: WrappedTokenInfo; list: TokenList } }> }
>

/**
 * An empty result, useful as a default.
 */
const EMPTY_LIST: TokenAddressMap = {
  [ChainId.KOVAN]: {},
  [ChainId.RINKEBY]: {},
  [ChainId.ROPSTEN]: {},
  [ChainId.GÖRLI]: {},
  [ChainId.MAINNET]: {},
  [ChainId.MATIC]: {},
  [ChainId.MUMBAI]: {},
  [ChainId.BSCTESTNET]: {},
  [ChainId.BSCMAINNET]: {},
  [ChainId.AVAXTESTNET]: {},
  [ChainId.AVAXMAINNET]: {}
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

export const getTokenAddressMap = (chainId?: ChainId) => {
  switch (chainId) {
    case ChainId.MAINNET:
      return listToTokenMap(MAINNET_TOKEN_LIST)
    case ChainId.ROPSTEN:
      return listToTokenMap(ROPSTEN_TOKEN_LIST)
    case ChainId.MATIC:
      return listToTokenMap(MATIC_TOKEN_LIST)
    case ChainId.MUMBAI:
      return listToTokenMap(MUMBAI_TOKEN_LIST)
    case ChainId.BSCTESTNET:
      return listToTokenMap(BSC_TESTNET_TOKEN_LIST)
    case ChainId.BSCMAINNET:
      return listToTokenMap(BSC_MAINNET_TOKEN_LIST)
    case ChainId.AVAXTESTNET:
      return listToTokenMap(AVAX_TESTNET_TOKEN_LIST)
    case ChainId.AVAXMAINNET:
      return listToTokenMap(AVAX_MAINNET_TOKEN_LIST)
    default:
      return listToTokenMap(MAINNET_TOKEN_LIST)
  }
}

const TRANSFORMED_DEFAULT_TOKEN_LIST = listToTokenMap(DEFAULT_TOKEN_LIST)

export function useDMMTokenList(): TokenAddressMap {
  const { chainId } = useActiveWeb3React()

  return getTokenAddressMap(chainId)
}

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

  let lists

  if (chainId && [ChainId.MATIC, ChainId.MUMBAI].includes(chainId)) {
    lists = Object.keys(allLists)
      .filter(key => MATIC_TOKEN_LISTS.includes(key))
      .reduce((obj, key) => {
        obj[key] = allLists[key]
        return obj
      }, INITIAL_LISTS)
  } else if (chainId && [ChainId.BSCTESTNET, ChainId.BSCMAINNET].includes(chainId)) {
    lists = Object.keys(allLists)
      .filter(key => BSC_TOKEN_LISTS.includes(key))
      .reduce((obj, key) => {
        obj[key] = allLists[key]
        return obj
      }, INITIAL_LISTS)
  } else if (chainId && [ChainId.AVAXTESTNET, ChainId.AVAXMAINNET].includes(chainId)) {
    lists = Object.keys(allLists)
      .filter(key => AVAX_TOKEN_LISTS.includes(key))
      .reduce((obj, key) => {
        obj[key] = allLists[key]
        return obj
      }, INITIAL_LISTS)
  } else {
    lists = Object.keys(allLists)
      .filter(
        key => !MATIC_TOKEN_LISTS.includes(key) && !BSC_TOKEN_LISTS.includes(key) && !AVAX_TOKEN_LISTS.includes(key)
      )
      .reduce((obj, key) => {
        obj[key] = allLists[key]
        return obj
      }, INITIAL_LISTS)
  }

  return lists
}

function combineMaps(map1: TokenAddressMap, map2: TokenAddressMap): TokenAddressMap {
  return {
    [ChainId.MAINNET]: { ...map1[ChainId.MAINNET], ...map2[ChainId.MAINNET] },
    [ChainId.RINKEBY]: { ...map1[ChainId.RINKEBY], ...map2[ChainId.RINKEBY] },
    [ChainId.ROPSTEN]: { ...map1[ChainId.ROPSTEN], ...map2[ChainId.ROPSTEN] },
    [ChainId.KOVAN]: { ...map1[ChainId.KOVAN], ...map2[ChainId.KOVAN] },
    [ChainId.GÖRLI]: { ...map1[ChainId.GÖRLI], ...map2[ChainId.GÖRLI] },
    [ChainId.MUMBAI]: { ...map1[ChainId.MUMBAI], ...map2[ChainId.MUMBAI] },
    [ChainId.MATIC]: { ...map1[ChainId.MATIC], ...map2[ChainId.MATIC] },
    [ChainId.BSCTESTNET]: { ...map1[ChainId.BSCTESTNET], ...map2[ChainId.BSCTESTNET] },
    [ChainId.BSCMAINNET]: { ...map1[ChainId.BSCMAINNET], ...map2[ChainId.BSCMAINNET] },
    [ChainId.AVAXTESTNET]: { ...map1[ChainId.AVAXTESTNET], ...map2[ChainId.AVAXTESTNET] },
    [ChainId.AVAXMAINNET]: { ...map1[ChainId.AVAXMAINNET], ...map2[ChainId.AVAXMAINNET] }
  }
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
            return combineMaps(allTokens, newTokens)
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
    (url: string) => !UNSUPPORTED_LIST_URLS.includes(url)
  )
}

export function useInactiveListUrls(): string[] {
  const lists = useAllLists()
  const allActiveListUrls = useActiveListUrls()

  return Object.keys(lists).filter(url => !allActiveListUrls?.includes(url) && !UNSUPPORTED_LIST_URLS.includes(url))
}

export function useDefaultTokenList(): TokenAddressMap {
  const dmmTokens = useDMMTokenList()

  return combineMaps(TRANSFORMED_DEFAULT_TOKEN_LIST, dmmTokens)
}

// get all the tokens from active lists, combine with local default tokens
export function useCombinedActiveList(): TokenAddressMap {
  const activeListUrls = useActiveListUrls()
  const activeTokens = useCombinedTokenMapFromUrls(activeListUrls)
  const defaultTokens = useDefaultTokenList()

  return combineMaps(activeTokens, defaultTokens)
}

// all tokens from inactive lists
export function useCombinedInactiveList(): TokenAddressMap {
  const allInactiveListUrls: string[] = useInactiveListUrls()
  return useCombinedTokenMapFromUrls(allInactiveListUrls)
}

// list of tokens not supported on interface, used to show warnings and prevent swaps and adds
export function useUnsupportedTokenList(): TokenAddressMap {
  // get hard coded unsupported tokens
  const localUnsupportedListMap = listToTokenMap(UNSUPPORTED_TOKEN_LIST)

  // get any loaded unsupported tokens
  const loadedUnsupportedListMap = useCombinedTokenMapFromUrls(UNSUPPORTED_LIST_URLS)

  // format into one token address map
  return combineMaps(localUnsupportedListMap, loadedUnsupportedListMap)
}

export function useIsListActive(url: string): boolean {
  const activeListUrls = useActiveListUrls()

  return Boolean(activeListUrls?.includes(url))
}
