import { Currency, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { getChainInfo } from 'constants/chainInfo'
import { SupportedChainId } from 'constants/chains'
import { DEFAULT_INACTIVE_LIST_URLS, DEFAULT_LIST_OF_LISTS } from 'constants/lists'
import { useCurrencyFromMap, useTokenFromMapOrNetwork } from 'lib/hooks/useCurrency'
import { getTokenFilter } from 'lib/hooks/useTokenList/filtering'
import { TokenAddressMap } from 'lib/hooks/useTokenList/utils'
import { useMemo } from 'react'
import { useAppSelector } from 'state/hooks'
import { isL2ChainId } from 'utils/chains'

import { useAllLists, useCombinedActiveList, useCombinedTokenMapFromUrls } from '../state/lists/hooks'
import { WrappedTokenInfo } from '../state/lists/wrappedTokenInfo'
import { deserializeToken, useUserAddedTokens } from '../state/user/hooks'
import { useUnsupportedTokenList } from './../state/lists/hooks'

type Maybe<T> = T | null | undefined

// reduce token map into standard address <-> Token mapping, optionally include user added tokens
function useTokensFromMap(tokenMap: TokenAddressMap, chainId: Maybe<SupportedChainId>): { [address: string]: Token } {
  return useMemo(() => {
    if (!chainId) return {}

    // reduce to just tokens
    return Object.keys(tokenMap[chainId] ?? {}).reduce<{ [address: string]: Token }>((newMap, address) => {
      newMap[address] = tokenMap[chainId][address].token
      return newMap
    }, {})
  }, [chainId, tokenMap])
}

// TODO(INFRA-164): after disallowing unchecked index access, refactor ChainTokenMap to not use ?'s
export type ChainTokenMap = { [chainId in number]?: { [address in string]?: Token } }
/** Returns tokens from all token lists on all chains, combined with user added tokens */
export function useAllTokensMultichain(): ChainTokenMap {
  const allTokensFromLists = useCombinedTokenMapFromUrls(DEFAULT_LIST_OF_LISTS)
  const userAddedTokensMap = useAppSelector(({ user: { tokens } }) => tokens)

  return useMemo(() => {
    const chainTokenMap: ChainTokenMap = {}

    if (userAddedTokensMap) {
      Object.keys(userAddedTokensMap).forEach((key) => {
        const chainId = Number(key)
        const tokenMap = {} as { [address in string]?: Token }
        Object.values(userAddedTokensMap[chainId]).forEach((serializedToken) => {
          tokenMap[serializedToken.address] = deserializeToken(serializedToken)
        })
        chainTokenMap[chainId] = tokenMap
      })
    }

    Object.keys(allTokensFromLists).forEach((key) => {
      const chainId = Number(key)
      const tokenMap = chainTokenMap[chainId] ?? {}
      Object.values(allTokensFromLists[chainId]).forEach(({ token }) => {
        tokenMap[token.address] = token
      })
      chainTokenMap[chainId] = tokenMap
    })

    return chainTokenMap
  }, [allTokensFromLists, userAddedTokensMap])
}

/** Returns all tokens from the default list + user added tokens */
export function useDefaultActiveTokens(chainId: Maybe<SupportedChainId>): { [address: string]: Token } {
  const defaultListTokens = useCombinedActiveList()
  const tokensFromMap = useTokensFromMap(defaultListTokens, chainId)
  const userAddedTokens = useUserAddedTokens()
  return useMemo(() => {
    return (
      userAddedTokens
        // reduce into all ALL_TOKENS filtered by the current chain
        .reduce<{ [address: string]: Token }>(
          (tokenMap, token) => {
            tokenMap[token.address] = token
            return tokenMap
          },
          // must make a copy because reduce modifies the map, and we do not
          // want to make a copy in every iteration
          { ...tokensFromMap }
        )
    )
  }, [tokensFromMap, userAddedTokens])
}

type BridgeInfo = Record<
  SupportedChainId,
  {
    tokenAddress: string
    originBridgeAddress: string
    destBridgeAddress: string
  }
>

export function useUnsupportedTokens(): { [address: string]: Token } {
  const { chainId } = useWeb3React()
  const listsByUrl = useAllLists()
  const unsupportedTokensMap = useUnsupportedTokenList()
  const unsupportedTokens = useTokensFromMap(unsupportedTokensMap, chainId)

  // checks the default L2 lists to see if `bridgeInfo` has an L1 address value that is unsupported
  const l2InferredBlockedTokens: typeof unsupportedTokens = useMemo(() => {
    if (!chainId || !isL2ChainId(chainId)) {
      return {}
    }

    if (!listsByUrl) {
      return {}
    }

    const listUrl = getChainInfo(chainId).defaultListUrl

    const { current: list } = listsByUrl[listUrl]
    if (!list) {
      return {}
    }

    const unsupportedSet = new Set(Object.keys(unsupportedTokens))

    return list.tokens.reduce((acc, tokenInfo) => {
      const bridgeInfo = tokenInfo.extensions?.bridgeInfo as unknown as BridgeInfo
      if (
        bridgeInfo &&
        bridgeInfo[SupportedChainId.MAINNET] &&
        bridgeInfo[SupportedChainId.MAINNET].tokenAddress &&
        unsupportedSet.has(bridgeInfo[SupportedChainId.MAINNET].tokenAddress)
      ) {
        const address = bridgeInfo[SupportedChainId.MAINNET].tokenAddress
        // don't rely on decimals--it's possible that a token could be bridged w/ different decimals on the L2
        return { ...acc, [address]: new Token(SupportedChainId.MAINNET, address, tokenInfo.decimals) }
      }
      return acc
    }, {})
  }, [chainId, listsByUrl, unsupportedTokens])

  return { ...unsupportedTokens, ...l2InferredBlockedTokens }
}

export function useSearchInactiveTokenLists(search: string | undefined, minResults = 10): WrappedTokenInfo[] {
  const lists = useAllLists()
  const inactiveUrls = DEFAULT_INACTIVE_LIST_URLS
  const { chainId } = useWeb3React()
  const activeTokens = useDefaultActiveTokens(chainId)
  return useMemo(() => {
    if (!search || search.trim().length === 0) return []
    const tokenFilter = getTokenFilter(search)
    const result: WrappedTokenInfo[] = []
    const addressSet: { [address: string]: true } = {}
    for (const url of inactiveUrls) {
      const list = lists[url]?.current
      if (!list) continue
      for (const tokenInfo of list.tokens) {
        if (tokenInfo.chainId === chainId && tokenFilter(tokenInfo)) {
          try {
            const wrapped: WrappedTokenInfo = new WrappedTokenInfo(tokenInfo, list)
            if (!(wrapped.address in activeTokens) && !addressSet[wrapped.address]) {
              addressSet[wrapped.address] = true
              result.push(wrapped)
              if (result.length >= minResults) return result
            }
          } catch {
            continue
          }
        }
      }
    }
    return result
  }, [activeTokens, chainId, inactiveUrls, lists, minResults, search])
}

// Check if currency is included in custom list from user storage
export function useIsUserAddedToken(currency: Currency | undefined | null): boolean {
  const userAddedTokens = useUserAddedTokens()

  if (!currency) {
    return false
  }

  return !!userAddedTokens.find((token) => currency.equals(token))
}

// undefined if invalid or does not exist
// null if loading or null was passed
// otherwise returns the token
export function useToken(tokenAddress?: string | null): Token | null | undefined {
  const { chainId } = useWeb3React()
  const tokens = useDefaultActiveTokens(chainId)
  return useTokenFromMapOrNetwork(tokens, tokenAddress)
}

export function useCurrency(currencyId: Maybe<string>, chainId?: SupportedChainId): Currency | null | undefined {
  const { chainId: connectedChainId } = useWeb3React()
  const tokens = useDefaultActiveTokens(chainId ?? connectedChainId)
  return useCurrencyFromMap(tokens, chainId ?? connectedChainId, currencyId)
}
