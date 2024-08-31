import { Currency, Token } from '@uniswap/sdk-core'
import { SupportedInterfaceChainId, useSupportedChainId } from 'constants/chains'
import { COMMON_BASES } from 'constants/routing'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { useAccount } from 'hooks/useAccount'
import { TokenAddressMap } from 'lib/hooks/useTokenList/utils'
import { useMemo } from 'react'
import { useCombinedInactiveLists } from 'state/lists/hooks'
import { TokenFromList } from 'state/lists/tokenFromList'
import { useUserAddedTokens } from 'state/user/userAddedTokens'
import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'

import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useCurrencyInfo as useUniswapCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { InterfaceChainId, UniverseChainId } from 'uniswap/src/types/chains'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { isAddress, isSameAddress } from 'utilities/src/addresses'

type Maybe<T> = T | undefined

// reduce token map into standard address <-> Token mapping, optionally include user added tokens
function useTokensFromMap(
  tokenMap: TokenAddressMap,
  chainId: Maybe<InterfaceChainId>,
): { [address: string]: TokenFromList } {
  return useMemo(() => {
    if (!chainId) {
      return {}
    }

    // reduce to just tokens
    return Object.keys(tokenMap[chainId] ?? {}).reduce<{ [address: string]: TokenFromList }>((newMap, address) => {
      newMap[address] = tokenMap[chainId][address].token
      return newMap
    }, {})
  }, [chainId, tokenMap])
}

/** Returns all tokens from local lists + user added tokens */
export function useFallbackListTokens(chainId: Maybe<InterfaceChainId>): { [address: string]: Token } {
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
          { ...tokensFromMap },
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

export function useCurrency(address?: string, chainId?: InterfaceChainId, skip?: boolean): Maybe<Currency> {
  const currencyInfo = useCurrencyInfo(address, chainId, skip)
  return currencyInfo?.currency
}

/**
 * Returns a CurrencyInfo from the tokenAddress+chainId pair.
 */
export function useCurrencyInfo(currency?: Currency): Maybe<CurrencyInfo>
export function useCurrencyInfo(address?: string, chainId?: InterfaceChainId, skip?: boolean): Maybe<CurrencyInfo>
export function useCurrencyInfo(
  addressOrCurrency?: string | Currency,
  chainId?: InterfaceChainId,
  skip?: boolean,
): Maybe<CurrencyInfo> {
  const { chainId: connectedChainId } = useAccount()
  const chainIdWithFallback =
    (typeof addressOrCurrency === 'string' ? chainId : addressOrCurrency?.chainId) ?? connectedChainId
  const nativeAddressWithFallback =
    UNIVERSE_CHAIN_INFO[chainIdWithFallback as UniverseChainId]?.nativeCurrency.address ??
    UNIVERSE_CHAIN_INFO[UniverseChainId.Mainnet]?.nativeCurrency.address

  const isNative = useMemo(() => checkIsNative(addressOrCurrency), [addressOrCurrency])
  const address = useMemo(
    () => getAddress(isNative, nativeAddressWithFallback, addressOrCurrency),
    [isNative, nativeAddressWithFallback, addressOrCurrency],
  )

  const supportedChainId = useSupportedChainId(chainIdWithFallback)

  const addressWithFallback = isNative || !address ? nativeAddressWithFallback : address

  const currencyId = buildCurrencyId(supportedChainId ?? UniverseChainId.Mainnet, addressWithFallback)
  const currencyInfo = useUniswapCurrencyInfo(currencyId)

  return useMemo(() => {
    const commonBase = getCommonBase(chainIdWithFallback, isNative, address)

    if (commonBase) {
      return commonBase
    }

    if (!currencyInfo || !addressOrCurrency || skip) {
      return undefined
    }

    return currencyInfo
  }, [addressOrCurrency, currencyInfo, chainIdWithFallback, isNative, address, skip])
}

const checkIsNative = (addressOrCurrency?: string | Currency): boolean => {
  return typeof addressOrCurrency === 'string'
    ? [NATIVE_CHAIN_ID, 'native', 'eth'].includes(addressOrCurrency.toLowerCase())
    : addressOrCurrency?.isNative ?? false
}

const getCommonBase = (chainId?: number, isNative?: boolean, address?: string): CurrencyInfo | undefined => {
  if (!address || !chainId) {
    return undefined
  }
  return COMMON_BASES[chainId]?.find(
    (base) =>
      (base.currency.isNative && isNative) || (base.currency.isToken && isSameAddress(base.currency.address, address)),
  )
}

const getAddress = (
  isNative: boolean,
  nativeAddressWithFallback: string,
  addressOrCurrency?: string | Currency,
): string | undefined => {
  if (typeof addressOrCurrency === 'string') {
    if (isNative) {
      return nativeAddressWithFallback
    } else {
      return addressOrCurrency
    }
  }

  if (addressOrCurrency) {
    if (addressOrCurrency.isNative) {
      return nativeAddressWithFallback
    } else if (addressOrCurrency) {
      return addressOrCurrency.address
    }
  }

  return undefined
}

export function useToken(tokenAddress?: string, chainId?: SupportedInterfaceChainId): Maybe<Token> {
  const formattedAddress = isAddress(tokenAddress)
  const { chainId: connectedChainId } = useAccount()
  const currency = useCurrency(formattedAddress ? formattedAddress : undefined, chainId ?? connectedChainId)

  return useMemo(() => {
    if (currency && currency.isToken) {
      return currency
    }
    return undefined
  }, [currency])
}
