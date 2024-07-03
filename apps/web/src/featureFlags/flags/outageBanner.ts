import { ApolloError } from '@apollo/client'
import { atomWithReset, useResetAtom, useUpdateAtom } from 'jotai/utils'
import { ProtocolVersion } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { UniverseChainId } from 'uniswap/src/types/chains'

export type ChainOutageData = {
  chainId: UniverseChainId
  version?: ProtocolVersion
}

export const manualChainOutageAtom = atomWithReset<ChainOutageData | undefined>(undefined)
export function useUpdateManualOutage({
  chainId,
  errorV3,
  errorV2,
}: {
  chainId?: UniverseChainId
  errorV3?: ApolloError
  errorV2?: ApolloError
}) {
  const setManualOutage = useUpdateAtom(manualChainOutageAtom)
  const resetManualOutage = useResetAtom(manualChainOutageAtom)
  resetManualOutage()
  if (errorV3 && chainId) {
    setManualOutage({ chainId })
  }
  if (errorV2 && chainId) {
    setManualOutage({ chainId, version: ProtocolVersion.V2 })
  }
}

export function useOutageBanners(): Partial<Record<UniverseChainId, boolean>> {
  return {
    [UniverseChainId.Optimism]: useFeatureFlag(FeatureFlags.OutageBannerOptimism),
    [UniverseChainId.ArbitrumOne]: useFeatureFlag(FeatureFlags.OutageBannerArbitrum),
    [UniverseChainId.Polygon]: useFeatureFlag(FeatureFlags.OutageBannerPolygon),
  }
}
