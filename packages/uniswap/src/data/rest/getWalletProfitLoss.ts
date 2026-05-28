import { PartialMessage } from '@bufbuild/protobuf'
import { createPromiseClient } from '@connectrpc/connect'
import { UseQueryResult, useQuery } from '@tanstack/react-query'
import { DataApiService } from '@uniswap/client-data-api/dist/data/v1/api_connect'
import { GetWalletProfitLossRequest, GetWalletProfitLossResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { transformInput, WithoutWalletAccount } from '@universe/api'
import { dataApiGetTransport } from 'uniswap/src/data/rest/base'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { persistableQueryOptions } from 'utilities/src/reactQuery/persistableQueryOptions'

const profitLossClient = createPromiseClient(DataApiService, dataApiGetTransport)

type GetWalletProfitLossInput = {
  input?: WithoutWalletAccount<PartialMessage<GetWalletProfitLossRequest>> & {
    evmAddress?: string
    svmAddress?: string
  }
  enabled?: boolean
}

export function useGetWalletProfitLossQuery({
  input,
  enabled,
}: GetWalletProfitLossInput): UseQueryResult<GetWalletProfitLossResponse | undefined> {
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
      queryFn: () =>
        transformedInput ? profitLossClient.getWalletProfitLoss(transformedInput) : Promise.resolve(undefined),
      enabled: !!address && !isTestnetModeEnabled && enabled !== false,
    }),
  )
}
