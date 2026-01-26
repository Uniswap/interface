import { useMemo } from 'react'
import { TokenOption } from 'uniswap/src/components/lists/items/types'
import { currencyInfosToTokenOptions } from 'uniswap/src/components/TokenSelector/hooks/useCurrencyInfosToTokenOptions'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { buildCurrency, buildCurrencyInfo } from 'uniswap/src/features/dataApi/utils/buildCurrency'
import { currencyId } from 'uniswap/src/utils/currencyId'

interface PoolToken {
  address?: string
  symbol?: string
  name?: string
  decimals?: number
}

interface Pool {
  token0?: PoolToken
  token1?: PoolToken
}

/**
 * Extract unique tokens from pools and convert them to TokenOptions
 * Format matches recent searches
 */
export function usePoolTokensOptions(
  pools: Pool[] | undefined,
  chainId: UniverseChainId,
): { tokenOptions: TokenOption[]; loading: boolean } {
  // Extract unique tokens from pools
  const uniqueTokens = useMemo(() => {
    if (!pools || pools.length === 0) {
      return []
    }

    const tokenMap = new Map<string, PoolToken>()

    pools.forEach((pool) => {
      // Add token0
      if (pool.token0?.address) {
        const key = pool.token0.address.toLowerCase()
        if (!tokenMap.has(key)) {
          tokenMap.set(key, pool.token0)
        }
      }

      // Add token1
      if (pool.token1?.address) {
        const key = pool.token1.address.toLowerCase()
        if (!tokenMap.has(key)) {
          tokenMap.set(key, pool.token1)
        }
      }
    })

    return Array.from(tokenMap.values())
  }, [pools])

  // Build CurrencyInfos directly from pool tokens (since GraphQL API doesn't support HashKey)
  const currencyInfos = useMemo(() => {
    if (uniqueTokens.length === 0) {
      return []
    }

    const infos: CurrencyInfo[] = []

    uniqueTokens.forEach((token) => {
      if (!token.address || !token.symbol || !token.name || token.decimals === undefined) {
        return
      }

      try {
        // Build currency from token data
        const currency = buildCurrency({
          chainId,
          address: token.address,
          decimals: token.decimals,
          symbol: token.symbol,
          name: token.name,
        })

        if (currency) {
          // Build currency info
          const currencyInfo = buildCurrencyInfo({
            currency,
            currencyId: currencyId(currency),
            logoUrl: undefined, // Pools data doesn't include logo
            safetyInfo: undefined, // No safety info from pools
          })

          if (currencyInfo) {
            infos.push(currencyInfo)
          }
        }
      } catch (error) {
        // Skip invalid tokens
        if (typeof window !== 'undefined') {
          console.warn('[usePoolTokensOptions] Failed to build currency for token:', token, error)
        }
      }
    })

    // Debug log
    if (typeof window !== 'undefined') {
      console.log('[usePoolTokensOptions] Debug:', {
        uniqueTokens: uniqueTokens.length,
        currencyInfos: infos.length,
        chainId,
      })
    }

    return infos
  }, [uniqueTokens, chainId])

  // Convert to TokenOptions (same format as recent searches)
  const tokenOptions = useMemo(() => {
    const options = currencyInfosToTokenOptions(currencyInfos) ?? []
    // Debug log
    if (typeof window !== 'undefined') {
      console.log('[usePoolTokensOptions] TokenOptions:', {
        currencyInfos: currencyInfos.length,
        tokenOptions: options.length,
      })
    }
    return options
  }, [currencyInfos])

  // Loading is false since we're building from pools data directly
  return { tokenOptions, loading: false }
}
