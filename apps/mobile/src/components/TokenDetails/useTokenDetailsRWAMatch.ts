import { GraphQLApi } from '@universe/api'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useMemo } from 'react'
import { useTokenDetailsContext } from 'src/components/TokenDetails/TokenDetailsContext'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { currencyIdToContractInput } from 'uniswap/src/features/dataApi/utils/currencyIdToContractInput'
import { findRWAMatch, type RWACandidate, type RWAMatch } from 'uniswap/src/features/rwa/rwaMatch'
import { useRWAWhitelist } from 'uniswap/src/features/rwa/useRWAWhitelist'
import { isNativeCurrencyAddress } from 'uniswap/src/utils/currencyId'

export function useTokenDetailsRWAMatch({ enabled = true }: { enabled?: boolean } = {}): RWAMatch | undefined {
  const rwaWhitelist = useRWAWhitelist(enabled)
  const { address, chainId, currencyId } = useTokenDetailsContext()

  const { data } = GraphQLApi.useTokenDetailsScreenQuery({
    variables: {
      ...currencyIdToContractInput(currencyId),
      multichain: true,
    },
    fetchPolicy: 'cache-only',
  })

  const rwaCandidates = useMemo<RWACandidate[]>(() => {
    const candidates: RWACandidate[] = []
    if (!isNativeCurrencyAddress(chainId, address)) {
      candidates.push({ chainId, address })
    }

    for (const token of data?.token?.project?.tokens ?? []) {
      const projectTokenChainId = fromGraphQLChain(token.chain)
      if (projectTokenChainId && token.address) {
        candidates.push({ chainId: projectTokenChainId, address: token.address })
      }
    }

    return candidates
  }, [address, chainId, data?.token?.project?.tokens])

  return useMemo(
    () => (enabled ? findRWAMatch({ rwaWhitelist, candidates: rwaCandidates }) : undefined),
    [enabled, rwaCandidates, rwaWhitelist],
  )
}

/** RWA whitelist match for the current TDP token, fetched only while the given feature flag is on. */
export function useGatedTokenDetailsRWAMatch(flag: FeatureFlags): RWAMatch | undefined {
  const enabled = useFeatureFlag(flag)
  return useTokenDetailsRWAMatch({ enabled })
}

export function useTokenDetailsPreferProjectMarketData(): boolean {
  const rwaMatch = useGatedTokenDetailsRWAMatch(FeatureFlags.RWACoinGeckoData)

  return rwaMatch !== undefined
}
