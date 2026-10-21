import { type PlainMessage } from '@bufbuild/protobuf'
import { queryOptions, type UseQueryResult, useQuery } from '@tanstack/react-query'
import { type GetWalletTokensProfitLossResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { getGetWalletTokensProfitLossQueryOptions, type GetWalletTokensProfitLossQueryParams } from '@universe/api'
import { dataApiServiceClientV1 } from 'uniswap/src/data/apiClients/dataApiService/clients/DataApiClient'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'

type GetWalletTokensProfitLossInput = GetWalletTokensProfitLossQueryParams & {
  enabled?: boolean
}

export function useGetWalletTokensProfitLossQuery({
  input,
  enabled,
}: GetWalletTokensProfitLossInput): UseQueryResult<PlainMessage<GetWalletTokensProfitLossResponse> | undefined> {
  const { isTestnetModeEnabled } = useEnabledChains()
  const hasAddress = !!input?.evmAddress || !!input?.svmAddress

  return useQuery(
    queryOptions({
      ...getGetWalletTokensProfitLossQueryOptions(dataApiServiceClientV1, { input }),
      enabled: hasAddress && !isTestnetModeEnabled && enabled !== false,
    }),
  )
}
