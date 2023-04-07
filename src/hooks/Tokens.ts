import { Currency, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { getChainInfo } from 'constants/chainInfo'
import { SupportedChainId } from 'constants/chains'
import { DEFAULT_INACTIVE_LIST_URLS, DEFAULT_LIST_OF_LISTS } from 'constants/lists'
import { useCurrencyFromMap, useTokenFromMapOrNetwork } from 'lib/hooks/useCurrency'
import { getTokenFilter } from 'lib/hooks/useTokenList/filtering'
import { ChainTokenInfoMap } from 'lib/hooks/useTokenList/utils'
import { useMemo } from 'react'
import { isL2ChainId } from 'utils/chains'

import { useAllLists, useCombinedActiveList, useCombinedTokenMapFromUrls } from '../state/lists/hooks'
import { WrappedTokenInfo } from '../state/lists/wrappedTokenInfo'
import { useUserAddedTokens, useUserAddedTokensMultichain, useUserAddedTokensOnChain } from '../state/user/hooks'
import { useUnsupportedTokenList } from './../state/lists/hooks'

export type TokenMap = { [address in string]?: Token }
export type ChainTokenMap = { [chain in number]?: TokenMap }
export function tokenMapToArray(tokens: TokenMap): Array<Token> {
  return Object.values(tokens).filter(Boolean) as Array<Token>
}

function toTokenMap(TokenInfoMap: ChainTokenInfoMap[number]) {
  const tokenMap: TokenMap = {}
  for (const tokenAddress in TokenInfoMap) {
    const tokenInfo = TokenInfoMap[tokenAddress]
    if (tokenInfo) tokenMap[tokenAddress] = tokenInfo.token
  }
  return tokenMap
}

function toChainTokenMap(chainTokenInfoMap: ChainTokenInfoMap) {
  const chainTokenMap: ChainTokenMap = {}
  for (const chain in chainTokenInfoMap) {
    chainTokenMap[chain] = toTokenMap(chainTokenInfoMap[chain])
  }
  return chainTokenMap
}

/** Reduces ChainTokenInfoMap to the standard TokenMap type. */
function useTokensFromMap(chainTokenInfoMap: ChainTokenInfoMap): TokenMap {
  const { chainId } = useWeb3React()
  return useMemo(() => {
    if (!chainId) return {}

    // reduce to just tokens
    return Object.keys(chainTokenInfoMap[chainId] ?? {}).reduce<TokenMap>((newMap, address) => {
      const entry = chainTokenInfoMap[chainId]?.[address]
      if (entry) newMap[address] = entry.token
      return newMap
    }, {})
  }, [chainId, chainTokenInfoMap])
}

export function useAllTokensMultichain(): ChainTokenMap {
  const userAddedChainTokenMap = useUserAddedTokensMultichain()
  const allListsChainTokenInfoMap = useCombinedTokenMapFromUrls(DEFAULT_LIST_OF_LISTS)

  return useMemo(() => {
    const allTokensMap = toChainTokenMap(allListsChainTokenInfoMap)

    for (const chain in userAddedChainTokenMap) {
      for (const tokenAddress in userAddedChainTokenMap[chain]) {
        if (allTokensMap[chain]?.[tokenAddress]) continue

        const token = userAddedChainTokenMap[chain]?.[tokenAddress]
        const currentChainMap = allTokensMap[chain]
        if (token && currentChainMap) currentChainMap[tokenAddress] = token
      }
    }

    return allTokensMap
  }, [allListsChainTokenInfoMap, userAddedChainTokenMap])
}

// Returns all tokens from the default list + user added tokens
export function useDefaultActiveTokens(): TokenMap {
  const defaultListTokens = useCombinedActiveList()
  const tokensFromMap = useTokensFromMap(defaultListTokens)
  const userAddedTokens = useUserAddedTokens()
  return useMemo(() => {
    return (
      userAddedTokens
        // reduce into all ALL_TOKENS filtered by the current chain
        .reduce<TokenMap>(
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

export function useUnsupportedTokens(): TokenMap {
  const { chainId } = useWeb3React()
  const listsByUrl = useAllLists()
  const unsupportedTokensMap = useUnsupportedTokenList()
  const unsupportedTokens = useTokensFromMap(unsupportedTokensMap)

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
  const activeTokens = useDefaultActiveTokens()
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

// Check if currency on specific chain is included in custom list from user storage
export function useIsUserAddedTokenOnChain(
  address: string | undefined | null,
  chain: number | undefined | null
): boolean {
  const userAddedTokens = useUserAddedTokensOnChain(chain)

  if (!address || !chain) {
    return false
  }

  return !!userAddedTokens.find((token) => token.address === address)
}

// undefined if invalid or does not exist
// null if loading or null was passed
// otherwise returns the token
export function useToken(tokenAddress?: string | null): Token | null | undefined {
  const tokens = useDefaultActiveTokens()
  return useTokenFromMapOrNetwork(tokens, tokenAddress)
}

export function useCurrency(currencyId?: string | null): Currency | null | undefined {
  const tokens = useDefaultActiveTokens()
  return useCurrencyFromMap(tokens, currencyId)
}
