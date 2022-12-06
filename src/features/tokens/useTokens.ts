// Based on code copied from https://github.com/Uniswap/interface/blob/main/src/hooks/Tokens.ts

import { useMemo } from 'react'
import { useCombinedActiveList } from 'src/features/tokenLists/hooks'
import { ChainIdToListedTokens } from 'src/features/tokenLists/types'
import { ChainIdToCurrencyIdToToken } from 'src/features/tokens/types'
import { useUserAddedTokens } from 'src/features/tokens/userAddedTokens'
import { toSupportedChainId } from 'src/utils/chainId'
import { buildCurrencyId, currencyId } from 'src/utils/currencyId'
import { getKeys } from 'src/utils/objects'

export function useAllTokens(): ChainIdToCurrencyIdToToken {
  const allTokens = useCombinedActiveList()
  return useTokensFromListedMap(allTokens, true)
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
