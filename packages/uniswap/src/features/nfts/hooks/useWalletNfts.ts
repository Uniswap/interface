import { FeatureFlags } from '@universe/gating'
import { getFeatureFlag } from '@universe/gating'
import { useWalletNfts as useWalletNftsRest } from 'uniswap/src/data/apiClients/dataApiService/nfts/useWalletNfts'
import { type UseWalletNftsResult, type UseWalletNftsProps } from 'uniswap/src/features/nfts/hooks/types'
import { useWalletNftsGraphQL } from 'uniswap/src/features/nfts/hooks/useWalletNftsGraphQL'

export function useWalletNfts({ skip, ...props }: UseWalletNftsProps): UseWalletNftsResult {
  const isV2EndpointsNftsEnabled = getFeatureFlag(FeatureFlags.V2EndpointsNfts)

  const restResult = useWalletNftsRest({
    skip: !isV2EndpointsNftsEnabled || skip,
    ...props,
  })

  const graphQLResult = useWalletNftsGraphQL({
    skip: isV2EndpointsNftsEnabled || skip,
    ...props,
  })

  return isV2EndpointsNftsEnabled ? restResult : graphQLResult
}
