import { ChainId, Currency, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { TokenAddressMap } from 'lib/hooks/useTokenList/utils'
import { useMemo } from 'react'

import { COMMON_BASES } from 'constants/routing'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { gqlTokenToCurrencyInfo } from 'graphql/data/types'
import { chainIdToBackendName } from 'graphql/data/util'
import {
  Token as GqlToken,
  useSimpleTokenQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { isSameAddress } from 'utilities/src/addresses'
import { getNativeTokenDBAddress } from 'utils/nativeTokens'
import { useCombinedInactiveLists } from '../state/lists/hooks'
import { useUserAddedTokens } from '../state/user/userAddedTokens'

type Maybe<T> = T | undefined

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

/** Returns all tokens from local lists + user added tokens */
export function useFallbackListTokens(chainId: Maybe<ChainId>): { [address: string]: Token } {
  const fallbackListTokens = useCombinedInactiveLists()
  const tokensFromMap = useTokensFromMap(fallbackListTokens, chainId)
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

// Check if currency is included in custom list from user storage
export function useIsUserAddedToken(currency: Currency | undefined | null): boolean {
  const userAddedTokens = useUserAddedTokens()

  if (!currency) {
    return false
  }

  return !!userAddedTokens.find((token) => currency.equals(token))
}

export function useCurrency(address?: string, chainId?: ChainId, skip?: boolean): Maybe<Currency> {
  const currencyInfo = useCurrencyInfo(address, chainId, skip)
  return currencyInfo?.currency
}

/**
 * Returns a CurrencyInfo from the tokenAddress+chainId pair.
 */
export function useCurrencyInfo(currency?: Currency): Maybe<CurrencyInfo>
export function useCurrencyInfo(address?: string, chainId?: ChainId, skip?: boolean): Maybe<CurrencyInfo>
export function useCurrencyInfo(
  addressOrCurrency?: string | Currency,
  chainId?: ChainId,
  skip?: boolean
): Maybe<CurrencyInfo> {
  const { chainId: connectedChainId } = useWeb3React()

  const address =
    typeof addressOrCurrency === 'string'
      ? addressOrCurrency
      : addressOrCurrency?.isNative
      ? NATIVE_CHAIN_ID
      : addressOrCurrency?.address
  const chainIdWithFallback =
    (typeof addressOrCurrency === 'string' ? chainId : addressOrCurrency?.chainId) ?? connectedChainId

  const backendChainName = chainIdToBackendName(chainIdWithFallback)
  const isNative =
    address === NATIVE_CHAIN_ID || address?.toLowerCase() === 'native' || address?.toLowerCase() === 'eth'

  const commonBase = chainIdWithFallback
    ? COMMON_BASES[chainIdWithFallback]?.find(
        (base) =>
          (base.currency.isNative && isNative) ||
          (base.currency.isToken && isSameAddress(base.currency.address, address))
      )
    : undefined

  const { data } = useSimpleTokenQuery({
    variables: {
      chain: backendChainName,
      address: isNative ? getNativeTokenDBAddress(backendChainName) : address ?? '',
    },
    skip: (!address && !isNative) || skip || !!commonBase,
    fetchPolicy: 'cache-first',
  })

  return useMemo(() => {
    if (commonBase) {
      return commonBase
    }

    if (!data?.token || !address || skip) {
      return
    }

    return gqlTokenToCurrencyInfo(data.token as GqlToken)
  }, [data?.token, address, skip, commonBase])
}

export function useToken(tokenAddress?: string, chainId?: ChainId): Maybe<Token> {
  const { chainId: connectedChainId } = useWeb3React()
  const currency = useCurrency(tokenAddress, chainId ?? connectedChainId)
  return useMemo(() => {
    if (!currency) {
      return undefined
    }
    if (currency instanceof Token) {
      return currency
    }
    return undefined
  }, [currency])
}
