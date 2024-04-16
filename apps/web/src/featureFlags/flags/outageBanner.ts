import { ApolloError } from '@apollo/client'
import { ChainId } from '@jaguarswap/sdk-core'
import { atomWithReset, useResetAtom, useUpdateAtom } from 'jotai/utils'
import { ProtocolVersion } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

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
    [ChainId.X1]: false,
    [ChainId.X1_TESTNET]: false,
  }
}
