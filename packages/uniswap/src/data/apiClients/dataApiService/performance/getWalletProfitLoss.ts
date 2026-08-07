import { PartialMessage, PlainMessage, toPlainMessage } from '@bufbuild/protobuf'
import { UseQueryResult, useQuery } from '@tanstack/react-query'
import { GetWalletProfitLossRequest, GetWalletProfitLossResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { transformInput, WithoutWalletAccount } from '@universe/api'
import { dataApiServiceClientV1 } from 'uniswap/src/data/apiClients/dataApiService/clients/DataApiClient'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { persistableQueryOptions } from 'utilities/src/reactQuery/persistableQueryOptions'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'

type GetWalletProfitLossInput = {
  input?: WithoutWalletAccount<PartialMessage<GetWalletProfitLossRequest>> & {
    evmAddress?: string
    svmAddress?: string
  }
  enabled?: boolean
  refetchInterval?: number | false
}

export function useGetWalletProfitLossQuery({
  input,
  enabled,
  refetchInterval,
}: GetWalletProfitLossInput): UseQueryResult<PlainMessage<GetWalletProfitLossResponse> | undefined> {
  const { isTestnetModeEnabled } = useEnabledChains()
  const transformedInput = transformInput(input)
  const address = transformedInput ? transformedInput.walletAccount.platformAddresses[0]?.address : undefined

  return useQuery(
    persistableQueryOptions({
      queryKey: [
        ReactQueryCacheKey.GetWalletProfitLoss,
        address,
        input?.chainIds,
        input?.since?.toString(),
        input?.till?.toString(),
        input?.modifier,
      ] as const,
      queryFn: async () =>
        transformedInput
          ? toPlainMessage(await dataApiServiceClientV1.getWalletProfitLoss(transformedInput))
          : undefined,
      enabled: !!address && !isTestnetModeEnabled && enabled !== false,
      refetchInterval,
      staleTime: ONE_MINUTE_MS,
    }),
  )
}
