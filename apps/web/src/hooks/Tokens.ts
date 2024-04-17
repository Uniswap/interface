import { ChainId, Currency, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { getChainInfo } from 'constants/chainInfo'
import { DEFAULT_INACTIVE_LIST_URLS, DEFAULT_LIST_OF_LISTS } from 'constants/lists'
import { getTokenFilter } from 'lib/hooks/useTokenList/filtering'
import { TokenAddressMap } from 'lib/hooks/useTokenList/utils'
import { useEffect, useMemo } from 'react'
import { useAppSelector } from 'state/hooks'
import { isL2ChainId } from 'utils/chains'

import { InterfaceEventName } from '@uniswap/analytics-events'
import { sendAnalyticsEvent } from 'analytics'
import { asSupportedChain, isSupportedChain } from 'constants/chains'
import { NATIVE_CHAIN_ID, TOKEN_SHORTHANDS, UNKNOWN_TOKEN_NAME, UNKNOWN_TOKEN_SYMBOL } from 'constants/tokens'
import { arrayify, parseBytes32String } from 'ethers/lib/utils'
import { gqlTokenToCurrencyInfo } from 'graphql/data/types'
import { chainIdToBackendName } from 'graphql/data/util'
import { useBytes32TokenContract, useTokenContract } from 'hooks/useContract'
import { NEVER_RELOAD, useSingleCallResult } from 'lib/hooks/multicall'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import { deserializeToken } from 'state/user/utils'
import {
  Token as GqlToken,
  useSimpleTokenQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { FeatureFlags } from 'uniswap/src/features/statsig/flags'
import { useFeatureFlag } from 'uniswap/src/features/statsig/hooks'
import { isAddress } from 'utilities/src/addresses'
import { DEFAULT_ERC20_DECIMALS } from 'utilities/src/tokens/constants'
import { getNativeTokenDBAddress } from 'utils/nativeTokens'
import { useAllLists, useCombinedActiveList, useCombinedTokenMapFromUrls } from '../state/lists/hooks'
import { TokenFromList } from '../state/lists/tokenFromList'
import { useUserAddedTokens } from '../state/user/userAddedTokens'
import { useUnsupportedTokenList } from './../state/lists/hooks'

type Maybe<T> = T | undefined

// parse a name or symbol from a token response
const BYTES32_REGEX = /^0x[a-fA-F0-9]{64}$/

function parseStringOrBytes32(str: string | undefined, bytes32: string | undefined, defaultValue: string): string {
  return str && str.length > 0
    ? str
    : // need to check for proper bytes string and valid terminator
    bytes32 && BYTES32_REGEX.test(bytes32) && arrayify(bytes32)[31] === 0
    ? parseBytes32String(bytes32)
    : defaultValue
}

/**
 * Returns a Token from the tokenAddress.
 * Returns null if token is loading or null was passed.
 * Returns undefined if tokenAddress is invalid or token does not exist.
 */
function useTokenFromActiveNetwork(tokenAddress: string | undefined): Token | null | undefined {
  const { chainId } = useWeb3React()

  const formattedAddress = isAddress(tokenAddress)
  const tokenContract = useTokenContract(formattedAddress ? formattedAddress : undefined, false)
  const tokenContractBytes32 = useBytes32TokenContract(formattedAddress ? formattedAddress : undefined, false)

  // TODO (WEB-1709): reduce this to one RPC call instead of 5
  // TODO: Fix redux-multicall so that these values do not reload.
  const tokenName = useSingleCallResult(tokenContract, 'name', undefined, NEVER_RELOAD)
  const tokenNameBytes32 = useSingleCallResult(tokenContractBytes32, 'name', undefined, NEVER_RELOAD)
  const symbol = useSingleCallResult(tokenContract, 'symbol', undefined, NEVER_RELOAD)
  const symbolBytes32 = useSingleCallResult(tokenContractBytes32, 'symbol', undefined, NEVER_RELOAD)
  const decimals = useSingleCallResult(tokenContract, 'decimals', undefined, NEVER_RELOAD)

  const isLoading = useMemo(
    () => decimals.loading || symbol.loading || tokenName.loading,
    [decimals.loading, symbol.loading, tokenName.loading]
  )
  const parsedDecimals = useMemo(() => decimals?.result?.[0] ?? DEFAULT_ERC20_DECIMALS, [decimals.result])

  const parsedSymbol = useMemo(
    () => parseStringOrBytes32(symbol.result?.[0], symbolBytes32.result?.[0], UNKNOWN_TOKEN_SYMBOL),
    [symbol.result, symbolBytes32.result]
  )
  const parsedName = useMemo(
    () => parseStringOrBytes32(tokenName.result?.[0], tokenNameBytes32.result?.[0], UNKNOWN_TOKEN_NAME),
    [tokenName.result, tokenNameBytes32.result]
  )

  return useMemo(() => {
    // If the token is on another chain, we cannot fetch it on-chain, and it is invalid.
    if (typeof tokenAddress !== 'string' || !isSupportedChain(chainId) || !formattedAddress) return undefined
    if (isLoading || !chainId) return null
    if (!decimals?.result?.[0] && parsedSymbol === UNKNOWN_TOKEN_SYMBOL && parsedName === UNKNOWN_TOKEN_NAME) {
      return undefined
    }

    return new Token(chainId, formattedAddress, parsedDecimals, parsedSymbol, parsedName)
  }, [tokenAddress, chainId, formattedAddress, isLoading, decimals?.result, parsedDecimals, parsedSymbol, parsedName])
}

type TokenMap = { [address: string]: Token }

/**
 * Returns a Token from the tokenAddress.
 * Returns null if token is loading or null was passed.
 * Returns undefined if tokenAddress is invalid or token does not exist.
 */
function useTokenFromMapOrNetwork(tokens: TokenMap, tokenAddress?: string | null): Token | undefined {
  const address = isAddress(tokenAddress)
  const token: Token | undefined = address ? tokens[address] : undefined
  const tokenFromNetwork = useTokenFromActiveNetwork(token ? undefined : address ? address : undefined)

  useEffect(() => {
    if (tokenFromNetwork) {
      sendAnalyticsEvent(InterfaceEventName.WALLET_PROVIDER_USED, {
        source: 'useTokenFromActiveNetwork',
        token: {
          name: tokenFromNetwork?.name,
          symbol: tokenFromNetwork?.symbol,
          address: tokenFromNetwork?.address,
          isNative: tokenFromNetwork?.isNative,
          chainId: tokenFromNetwork?.chainId,
        },
      })
    }
  }, [tokenFromNetwork])

  return tokenFromNetwork ?? token
}

/**
 * Returns a Currency from the currencyId.
 * Returns null if currency is loading or null was passed.
 * Returns undefined if currencyId is invalid or token does not exist.
 */
function useCurrencyFromMap(
  tokens: TokenMap,
  chainId: ChainId | undefined,
  currencyId?: string | null
): Currency | undefined {
  const nativeCurrency = useNativeCurrency(chainId)
  const isNative = Boolean(nativeCurrency && currencyId?.toUpperCase() === 'ETH')
  const shorthandMatchAddress = useMemo(() => {
    const chain = asSupportedChain(chainId)
    return chain && currencyId ? TOKEN_SHORTHANDS[currencyId.toUpperCase()]?.[chain] : undefined
  }, [chainId, currencyId])

  const token = useTokenFromMapOrNetwork(tokens, isNative ? undefined : shorthandMatchAddress ?? currencyId)

  if (currencyId === null || currencyId === undefined || !isSupportedChain(chainId)) return

  // this case so we use our builtin wrapped token instead of wrapped tokens on token lists
  const wrappedNative = nativeCurrency?.wrapped
  if (wrappedNative?.address?.toUpperCase() === currencyId?.toUpperCase()) return wrappedNative
  return isNative ? nativeCurrency : token
}

// reduce token map into standard address <-> Token mapping, optionally include user added tokens
function useTokensFromMap(tokenMap: TokenAddressMap, chainId: Maybe<ChainId>): { [address: string]: Token } {
  return useMemo(() => {
    if (!chainId) return {}

    // reduce to just tokens
    return Object.keys(tokenMap[chainId] ?? {}).reduce<{ [address: string]: Token }>((newMap, address) => {
      newMap[address] = tokenMap[chainId][address].token
      return newMap
    }, {})
  }, [chainId, tokenMap])
}

// TODO(WEB-2347): after disallowing unchecked index access, refactor ChainTokenMap to not use ?'s
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
export function useDefaultActiveTokens(chainId: Maybe<ChainId>): { [address: string]: Token } {
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
  ChainId,
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

    const list = listsByUrl[listUrl]?.current
    if (!list) {
      return {}
    }

    const unsupportedSet = new Set(Object.keys(unsupportedTokens))

    return list.tokens.reduce((acc, tokenInfo) => {
      const bridgeInfo = tokenInfo.extensions?.bridgeInfo as unknown as BridgeInfo
      if (
        bridgeInfo &&
        bridgeInfo[ChainId.MAINNET] &&
        bridgeInfo[ChainId.MAINNET].tokenAddress &&
        unsupportedSet.has(bridgeInfo[ChainId.MAINNET].tokenAddress)
      ) {
        const address = bridgeInfo[ChainId.MAINNET].tokenAddress
        // don't rely on decimals--it's possible that a token could be bridged w/ different decimals on the L2
        return { ...acc, [address]: new Token(ChainId.MAINNET, address, tokenInfo.decimals) }
      }
      return acc
    }, {})
  }, [chainId, listsByUrl, unsupportedTokens])

  return { ...unsupportedTokens, ...l2InferredBlockedTokens }
}

export function useSearchInactiveTokenLists(search: string | undefined, minResults = 10): TokenFromList[] {
  const lists = useAllLists()
  const inactiveUrls = DEFAULT_INACTIVE_LIST_URLS
  const { chainId } = useWeb3React()
  const activeTokens = useDefaultActiveTokens(chainId)
  return useMemo(() => {
    if (!search || search.trim().length === 0) return []
    const tokenFilter = getTokenFilter(search)
    const result: TokenFromList[] = []
    const addressSet: { [address: string]: true } = {}
    for (const url of inactiveUrls) {
      const list = lists[url]?.current
      if (!list) continue
      for (const tokenInfo of list.tokens) {
        if (tokenInfo.chainId === chainId && tokenFilter(tokenInfo)) {
          try {
            const wrapped: TokenFromList = new TokenFromList(tokenInfo, list)
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
export function useTokenListToken(tokenAddress?: string | null): Token | undefined {
  const { chainId } = useWeb3React()
  const tokens = useDefaultActiveTokens(chainId)
  return useTokenFromMapOrNetwork(tokens, tokenAddress)
}

function useTokenListCurrency(currencyId: Maybe<string>, chainId?: ChainId): Currency | undefined {
  const { chainId: connectedChainId } = useWeb3React()
  const tokens = useDefaultActiveTokens(chainId ?? connectedChainId)
  return useCurrencyFromMap(tokens, chainId ?? connectedChainId, currencyId)
}

export function useCurrency(address?: string, chainId?: ChainId, skip?: boolean): Maybe<Currency> {
  const currencyInfo = useCurrencyInfo(address, chainId, skip)
  const gqlTokenListsEnabled = useFeatureFlag(FeatureFlags.GqlTokenLists)
  const tokenListCurrency = useTokenListCurrency(address, chainId)
  return gqlTokenListsEnabled ? currencyInfo?.currency : tokenListCurrency
}

/**
 * Returns a CurrencyInfo from the tokenAddress+chainId pair. This should only
 * be used directly if the gqlTokenListsEnabled flag is enabled, otherwise it
 * will return undefined every time.
 */
export function useCurrencyInfo(currency?: Currency): Maybe<CurrencyInfo>
export function useCurrencyInfo(address?: string, chainId?: ChainId, skip?: boolean): Maybe<CurrencyInfo>
export function useCurrencyInfo(
  addressOrCurrency?: string | Currency,
  chainId?: ChainId,
  skip?: boolean
): Maybe<CurrencyInfo> {
  const { chainId: connectedChainId } = useWeb3React()
  const gqlTokenListsEnabled = useFeatureFlag(FeatureFlags.GqlTokenLists)

  const address =
    typeof addressOrCurrency === 'string'
      ? addressOrCurrency
      : addressOrCurrency?.isNative
      ? NATIVE_CHAIN_ID
      : addressOrCurrency?.address

  const currencyChainId = typeof addressOrCurrency === 'string' ? chainId : addressOrCurrency?.chainId

  const backendChainName = chainIdToBackendName(currencyChainId ?? connectedChainId)
  const isNative =
    address === NATIVE_CHAIN_ID || address?.toLowerCase() === 'native' || address?.toLowerCase() === 'eth'
  const { data } = useSimpleTokenQuery({
    variables: {
      chain: backendChainName,
      address: isNative ? getNativeTokenDBAddress(backendChainName) : address ?? '',
    },
    skip: (!address && !isNative) || skip || !gqlTokenListsEnabled,
    fetchPolicy: 'cache-first',
  })

  return useMemo(() => {
    if (!gqlTokenListsEnabled) {
      return undefined
    }

    if (!data?.token || !address || skip) {
      return
    }

    return gqlTokenToCurrencyInfo(data.token as GqlToken)
  }, [gqlTokenListsEnabled, data?.token, address, skip])
}

export function useToken(tokenAddress?: string, chainId?: ChainId): Maybe<Token> {
  const gqlTokenListsEnabled = useFeatureFlag(FeatureFlags.GqlTokenLists)
  const tokenListToken = useTokenListToken(tokenAddress)

  const { chainId: connectedChainId } = useWeb3React()
  const currency = useCurrency(tokenAddress, chainId ?? connectedChainId)
  return useMemo(() => {
    if (!gqlTokenListsEnabled) {
      return tokenListToken
    }
    if (!currency) {
      return undefined
    }
    if (currency instanceof Token) {
      return currency
    }
    return undefined
  }, [currency, gqlTokenListsEnabled, tokenListToken])
}
