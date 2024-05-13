import { ApolloError } from '@apollo/client'
import { ChainId } from '@uniswap/sdk-core'
import { SupportedInterfaceChainId } from 'constants/chains'
import { atomWithReset, useResetAtom, useUpdateAtom } from 'jotai/utils'
import { ProtocolVersion } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'

export type ChainOutageData = {
  chainId: SupportedInterfaceChainId
  version?: ProtocolVersion
}

export const manualChainOutageAtom = atomWithReset<ChainOutageData | undefined>(undefined)
export function useUpdateManualOutage({
  chainId,
  errorV3,
  errorV2,
}: {
  chainId?: SupportedInterfaceChainId
  errorV3?: ApolloError
  errorV2?: ApolloError
}) {
  const setManualOutage = useUpdateAtom(manualChainOutageAtom)
  const resetManualOutage = useResetAtom(manualChainOutageAtom)
  resetManualOutage()
  if (errorV3 && chainId) setManualOutage({ chainId })
  if (errorV2 && chainId) setManualOutage({ chainId, version: ProtocolVersion.V2 })
}

export function useOutageBanners(): Partial<Record<SupportedInterfaceChainId, boolean>> {
  return {
    [ChainId.OPTIMISM]: useFeatureFlag(FeatureFlags.OutageBannerOptimism),
    [ChainId.ARBITRUM_ONE]: useFeatureFlag(FeatureFlags.OutageBannerArbitrum),
    [ChainId.POLYGON]: useFeatureFlag(FeatureFlags.OutageBannerPolygon),
  }
}
