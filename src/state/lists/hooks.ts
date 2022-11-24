import { ChainId } from '@kyberswap/ks-sdk-core'
import { Tags, TokenList } from '@uniswap/token-lists'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'

import { SUPPORTED_NETWORKS } from 'constants/networks'
import useDebounce from 'hooks/useDebounce'
import { AppState } from 'state/index'
import { isAddress } from 'utils'
import { getFormattedAddress } from 'utils/tokenInfo'

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
    .map(token => `${token.chainId}-${token.address}`)
    .join('')
}

function listToTokenMap(list: TokenList): TokenAddressMap {
  const serializedList = serializeList(list)
  const result = listCache[serializedList]
  if (result) return result

  const map = list.tokens.reduce<TokenAddressMapWriteable>((tokenMap, tokenInfo) => {
    const formattedAddress = getFormattedAddress(tokenInfo.chainId, tokenInfo.address)

    if (
      tokenMap[tokenInfo.chainId]?.[formattedAddress] !== undefined ||
      !isAddress(tokenInfo.chainId, tokenInfo.address)
    ) {
      return tokenMap
    }
    const token = new WrappedTokenInfo(tokenInfo)
    tokenMap[tokenInfo.chainId][formattedAddress] = token
    return tokenMap
  }, EMPTY_LIST())

  listCache[serializedList] = map
  return map
}

// returns all downloaded current lists
export type ListType = {
  readonly [url: string]: {
    readonly current: TokenList | null
    // readonly pendingUpdate: TokenList | null
    readonly loadingRequestId: string | null
    readonly error: string | null
  }
}

export function useAllLists(): ListType {
  const lists = useSelector<AppState, AppState['lists']['byUrl']>(state => state.lists.byUrl)
  const debouncedLists = useDebounce(lists, 1000)
  return debouncedLists
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

export function useCombinedActiveList(): TokenAddressMap {
  const lists = useAllLists()
  const urls = Object.keys(lists)
  const filteredUrls = useMemo(() => urls.filter(url => lists[url]?.current).sort(), [lists, urls])

  return useMemo(() => {
    if (!filteredUrls) return EMPTY_LIST()
    // we have already filtered out nullish values above => lists[url]?.current is truthy value
    // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain, @typescript-eslint/no-non-null-assertion
    return combineMultipleMaps([EMPTY_LIST(), ...filteredUrls.map(url => listToTokenMap(lists[url]?.current!))])!
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filteredUrls), lists])
}
