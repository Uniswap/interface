import { type PlainMessage } from '@bufbuild/protobuf'
import { queryOptions, type UseQueryResult, useQuery } from '@tanstack/react-query'
import { type GetWalletProfitLossResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { getGetWalletProfitLossQueryOptions, type GetWalletProfitLossQueryParams } from '@universe/api'
import { dataApiServiceClientV1 } from 'uniswap/src/data/apiClients/dataApiService/clients/DataApiClient'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'

type GetWalletProfitLossInput = GetWalletProfitLossQueryParams & {
  enabled?: boolean
  refetchInterval?: number | false
}

export function useGetWalletProfitLossQuery({
  input,
  enabled,
  refetchInterval,
}: GetWalletProfitLossInput): UseQueryResult<PlainMessage<GetWalletProfitLossResponse> | undefined> {
  const { isTestnetModeEnabled } = useEnabledChains()
  const hasAddress = !!input?.evmAddress || !!input?.svmAddress

  return useQuery(
    queryOptions({
      ...getGetWalletProfitLossQueryOptions(dataApiServiceClientV1, { input }),
      enabled: hasAddress && !isTestnetModeEnabled && enabled !== false,
      refetchInterval,
    }),
  )
}
