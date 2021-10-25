// Based on code copied from https://github.com/Uniswap/interface/blob/main/src/hooks/Tokens.ts

import { Token } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { ChainIdTo, SupportedChainId } from 'src/constants/chains'
import { useCombinedActiveList, useUnsupportedTokenList } from 'src/features/tokenLists/hooks'
import { ChainIdToListedTokens } from 'src/features/tokenLists/types'
import { useUserAddedTokens } from 'src/features/tokens/userAddedTokens'
import { toSupportedChain } from 'src/utils/chainId'
import { getKeys } from 'src/utils/objects'

type ChainIdToAddressToToken = ChainIdTo<Record<Address, Token>>

export function useAllTokens(): ChainIdToAddressToToken {
  const allTokens = useCombinedActiveList()
  return useTokensFromListedMap(allTokens, true)
}

export function useUnsupportedTokens(): ChainIdToAddressToToken {
  const unsupportedTokensMap = useUnsupportedTokenList()
  return useTokensFromListedMap(unsupportedTokensMap, false)
}

export function useIsTokenActive(token: Nullable<Token>): boolean {
  const activeTokens = useAllTokens()
  if (!activeTokens || !token) return false
  const chainId = token.chainId as SupportedChainId
  return !!activeTokens[chainId]?.[token.address]
}

// Reduce token map into standard address <-> Token mapping, optionally include user added tokens
// Called useTokensFromMap in web app code
function useTokensFromListedMap(
  listedTokenMap: ChainIdToListedTokens,
  includeUserAdded: boolean
): ChainIdToAddressToToken {
  const userAddedTokens = useUserAddedTokens()

  return useMemo(() => {
    // reduce to just tokens
    const mapWithoutUrls: ChainIdToAddressToToken = {}
    for (const _chainId of getKeys(listedTokenMap)) {
      for (const tokenAddr of getKeys(listedTokenMap[_chainId])) {
        const tokenInfo = listedTokenMap[_chainId][tokenAddr]
        const chainId = toSupportedChain(_chainId)
        mapWithoutUrls[chainId] ??= {}
        mapWithoutUrls[chainId]![tokenAddr] = tokenInfo.token
      }
    }

    if (includeUserAdded) {
      return (
        userAddedTokens
          // reduce into all ALL_TOKENS filtered by the current chain
          .reduce<ChainIdToAddressToToken>(
            (newMap, token) => {
              const chainId = toSupportedChain(token.chainId)
              newMap[chainId] ??= {}
              newMap[chainId]![token.address] = token
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
