// Based on code copied from https://github.com/Uniswap/interface/blob/main/src/hooks/Tokens.ts

import { Token } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { NATIVE_ADDRESS_ALT } from 'src/constants/addresses'
import { ChainId } from 'src/constants/chains'
import { useActiveChainIds } from 'src/features/chains/utils'
import {
  useCombinedActiveList,
  useUniswapDefaultList,
  useUnsupportedTokenList,
} from 'src/features/tokenLists/hooks'
import { NativeCurrency } from 'src/features/tokenLists/NativeCurrency'
import { ChainIdToListedTokens } from 'src/features/tokenLists/types'
import {
  ChainIdToCurrencyIdToCurrency,
  ChainIdToCurrencyIdToNativeCurrency,
  ChainIdToCurrencyIdToToken,
} from 'src/features/tokens/types'
import { useUserAddedTokens } from 'src/features/tokens/userAddedTokens'
import { toSupportedChainId } from 'src/utils/chainId'
import { buildCurrencyId, currencyId } from 'src/utils/currencyId'
import { getKeys } from 'src/utils/objects'

export function useAllTokens(): ChainIdToCurrencyIdToToken {
  const allTokens = useCombinedActiveList()
  return useTokensFromListedMap(allTokens, true)
}

export function useAllCurrencies(): ChainIdToCurrencyIdToCurrency {
  const tokens = useAllTokens()
  const nativeCurrencies = useNativeCurrencies()

  return useMemo(() => {
    const chains = getKeys(nativeCurrencies)
    return chains.reduce<ChainIdToCurrencyIdToCurrency>((result, chainId) => {
      result[chainId] = {
        ...nativeCurrencies[chainId],
        ...tokens[chainId],
      }
      return result
    }, {})
  }, [nativeCurrencies, tokens])
}

export function useNativeCurrencies(): ChainIdToCurrencyIdToNativeCurrency {
  const activeChains = useActiveChainIds()

  return useMemo(
    () =>
      activeChains.reduce<ChainIdToCurrencyIdToNativeCurrency>((result, chainId) => {
        const currency = NativeCurrency.onChain(chainId)
        result[chainId] = { [currencyId(currency)]: currency }

        if (chainId === ChainId.Polygon) {
          // MATIC has an alternative address
          // TODO: consider another way to reconcile
          result[chainId]![buildCurrencyId(chainId, NATIVE_ADDRESS_ALT)] = currency
        }

        return result
      }, {}),
    [activeChains]
  )
}

export function useUnsupportedTokens(): ChainIdToCurrencyIdToToken {
  const unsupportedTokensMap = useUnsupportedTokenList()
  return useTokensFromListedMap(unsupportedTokensMap, false)
}

// Used for determining risk levels of tokens.
export function useUniswapDefaultTokens(): ChainIdToCurrencyIdToToken {
  const uniswapDefaultTokenMap = useUniswapDefaultList()
  return useTokensFromListedMap(uniswapDefaultTokenMap, false)
}

export function useIsTokenActive(token: NullUndefined<Token>): boolean {
  const activeTokens = useAllTokens()
  if (!activeTokens || !token) return false
  const chainId = token.chainId as ChainId
  return !!activeTokens[chainId]?.[token.address]
}

// Reduce token map into standard address <-> Token mapping, optionally include user added tokens
// Called useTokensFromMap in web app code
function useTokensFromListedMap(
  listedTokenMap: ChainIdToListedTokens,
  includeUserAdded: boolean
): ChainIdToCurrencyIdToToken {
  const userAddedTokens = useUserAddedTokens()

  return useMemo(() => {
    // reduce to just tokens
    const mapWithoutUrls: ChainIdToCurrencyIdToToken = {}
    for (const _chainId of getKeys(listedTokenMap)) {
      const chainId = toSupportedChainId(_chainId)
      if (!chainId) continue
      for (const tokenAddr of getKeys(listedTokenMap[chainId])) {
        const tokenInfo = listedTokenMap[chainId][tokenAddr]
        mapWithoutUrls[chainId] ??= {}
        mapWithoutUrls[chainId]![buildCurrencyId(chainId, tokenAddr.toString())] = tokenInfo.token
      }
    }

    if (includeUserAdded) {
      return (
        userAddedTokens
          // reduce into all ALL_TOKENS filtered by the current chain
          .reduce<ChainIdToCurrencyIdToToken>(
            (newMap, token) => {
              const chainId = toSupportedChainId(token.chainId)
              if (!chainId) return newMap
              newMap[chainId] ??= {}
              newMap[chainId]![currencyId(token)] = token
              return newMap
            },
            // must make a copy because reduce modifies the map, and we do not
            // want to make a copy in every iteration
            { ...mapWithoutUrls }
          )
      )
    }

    return mapWithoutUrls
  }, [userAddedTokens, listedTokenMap, includeUserAdded])
}
