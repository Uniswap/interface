import { ApolloError } from '@apollo/client'
import { GraphQLApi } from '@universe/api'
import { atomWithReset, useResetAtom, useUpdateAtom } from 'jotai/utils'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

export type ChainOutageData = {
  chainId: UniverseChainId
  version?: GraphQLApi.ProtocolVersion
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
    setManualOutage({ chainId, version: GraphQLApi.ProtocolVersion.V2 })
  }
}
