import { ApolloError } from '@apollo/client'
import { ChainId } from '@uniswap/sdk-core'
import { atomWithReset, useResetAtom, useUpdateAtom } from 'jotai/utils'
import { ProtocolVersion } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'

export type ChainOutageData = {
  chainId: ChainId
  version?: ProtocolVersion
}

export const manualChainOutageAtom = atomWithReset<ChainOutageData | undefined>(undefined)
export function useUpdateManualOutage({
  chainId,
  errorV3,
  errorV2,
}: {
  chainId?: ChainId
  errorV3?: ApolloError
  errorV2?: ApolloError
}) {
  const setManualOutage = useUpdateAtom(manualChainOutageAtom)
  const resetManualOutage = useResetAtom(manualChainOutageAtom)
  resetManualOutage()
  if (errorV3 && chainId) setManualOutage({ chainId })
  if (errorV2 && chainId) setManualOutage({ chainId, version: ProtocolVersion.V2 })
}

export function useOutageBanners(): Record<ChainId, boolean> {
  return {
    [ChainId.OPTIMISM]: useFeatureFlag(FeatureFlags.OutageBannerOptimism),
    [ChainId.ARBITRUM_ONE]: useFeatureFlag(FeatureFlags.OutageBannerArbitrum),
    [ChainId.POLYGON]: useFeatureFlag(FeatureFlags.OutageBannerPolygon),

    [ChainId.MAINNET]: false,
    [ChainId.GOERLI]: false,
    [ChainId.SEPOLIA]: false,
    [ChainId.OPTIMISM_GOERLI]: false,
    [ChainId.OPTIMISM_SEPOLIA]: false,
    [ChainId.ARBITRUM_GOERLI]: false,
    [ChainId.ARBITRUM_SEPOLIA]: false,
    [ChainId.POLYGON_MUMBAI]: false,
    [ChainId.CELO]: false,
    [ChainId.CELO_ALFAJORES]: false,
    [ChainId.GNOSIS]: false,
    [ChainId.MOONBEAM]: false,
    [ChainId.BNB]: false,
    [ChainId.AVALANCHE]: false,
    [ChainId.BASE_GOERLI]: false,
    [ChainId.BASE]: false,
    [ChainId.ZORA_SEPOLIA]: false,
    [ChainId.ZORA]: false,
    [ChainId.ROOTSTOCK]: false,
    [ChainId.BLAST]: false,
  }
}
