import { useMemo } from 'react'
import { useTokenProjectTokensTvlPartsFragment } from 'uniswap/src/data/graphql/uniswap-data-api/fragments'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'

interface HighestTvlChainResult {
  chainId: UniverseChainId | null
  address: string | null
}

/**
 * Returns the chain with the highest TVL for a given token's project.
 * Reads per-chain TVL data from Apollo cache (populated by the TokenDetailsScreen query).
 * Returns nulls if data is unavailable or all TVL values are 0.
 */
export function useHighestTvlChain({ currencyId }: { currencyId: string }): HighestTvlChainResult {
  const { data } = useTokenProjectTokensTvlPartsFragment({ currencyId })
  const projectTokens = data.project?.tokens

  return useMemo(() => {
    if (!projectTokens?.length) {
      return { chainId: null, address: null }
    }

    let bestTvl = 0
    let bestIndex = -1

    for (let i = 0; i < projectTokens.length; i++) {
      const token = projectTokens[i]
      if (!token) {
        continue
      }
      const tvl = token.market?.totalValueLocked?.value ?? 0
      if (tvl > bestTvl) {
        bestTvl = tvl
        bestIndex = i
      }
    }

    const bestToken = bestIndex >= 0 ? projectTokens[bestIndex] : undefined
    if (!bestToken) {
      return { chainId: null, address: null }
    }

    const chainId = fromGraphQLChain(bestToken.chain)
    return { chainId: chainId ?? null, address: bestToken.address ?? null }
  }, [projectTokens])
}
