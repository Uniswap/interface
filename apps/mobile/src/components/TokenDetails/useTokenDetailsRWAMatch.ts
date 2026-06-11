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
  const multichainTokenUxEnabled = useFeatureFlag(FeatureFlags.MultichainTokenUx)
  const rwaWhitelist = useRWAWhitelist(enabled)
  const { address, chainId, currencyId } = useTokenDetailsContext()

  const { data } = GraphQLApi.useTokenDetailsScreenQuery({
    variables: {
      ...currencyIdToContractInput(currencyId),
      multichain: multichainTokenUxEnabled,
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

export function useTokenDetailsPreferProjectMarketData(): boolean {
  const rwaCoinGeckoDataEnabled = useFeatureFlag(FeatureFlags.RWACoinGeckoData)
  const rwaMatch = useTokenDetailsRWAMatch({ enabled: rwaCoinGeckoDataEnabled })

  return rwaMatch !== undefined
}
