import { type PlainMessage } from '@bufbuild/protobuf'
import { queryOptions, type UseQueryResult, useQuery } from '@tanstack/react-query'
import { type GetWalletTokenProfitLossResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { getGetWalletTokenProfitLossQueryOptions, type GetWalletTokenProfitLossQueryParams } from '@universe/api'
import { dataApiServiceClientV1 } from 'uniswap/src/data/apiClients/dataApiService/clients/DataApiClient'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'

type GetWalletTokenProfitLossInput = GetWalletTokenProfitLossQueryParams & {
  enabled?: boolean
}

export function useGetWalletTokenProfitLossQuery({
  input,
  enabled,
}: GetWalletTokenProfitLossInput): UseQueryResult<PlainMessage<GetWalletTokenProfitLossResponse> | undefined> {
  const { isTestnetModeEnabled } = useEnabledChains()
  const hasAddress = !!input?.evmAddress || !!input?.svmAddress

  return useQuery(
    queryOptions({
      ...getGetWalletTokenProfitLossQueryOptions(dataApiServiceClientV1, { input }),
      enabled: !!input?.tokenAddress && hasAddress && !isTestnetModeEnabled && enabled !== false,
    }),
  )
}
