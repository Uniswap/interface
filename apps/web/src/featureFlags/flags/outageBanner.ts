import { ApolloError } from '@apollo/client'
import { GraphQLApi } from '@universe/api'
import { DynamicConfigs, OutageBannerChainIdConfigKey, useDynamicConfigValue } from '@universe/gating'
import { atomWithReset, useResetAtom, useUpdateAtom } from 'jotai/utils'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

export type ChainOutageData = {
  chainId: UniverseChainId
  version?: GraphQLApi.ProtocolVersion
}

export const manualChainOutageAtom = atomWithReset<ChainOutageData | undefined>(undefined)

export function useChainOutageConfig(): ChainOutageData | undefined {
  const chainId = useDynamicConfigValue({
    config: DynamicConfigs.OutageBannerChainId,
    key: OutageBannerChainIdConfigKey.ChainId,
    defaultValue: undefined,
    customTypeGuard: (x): x is UniverseChainId | undefined => {
      return x === undefined || (typeof x === 'number' && x > 0)
    },
  })

  if (!chainId) {
    return undefined
  }

  return { chainId }
}

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
    setManualOutage({ chainId, version: GraphQLApi.ProtocolVersion.V2 })
  }
}
