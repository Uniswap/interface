import { PartialMessage, PlainMessage, toPlainMessage } from '@bufbuild/protobuf'
import { UseQueryResult, useQuery } from '@tanstack/react-query'
import {
  GetWalletTokenProfitLossRequest,
  GetWalletTokenProfitLossResponse,
} from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { transformInput, WithoutWalletAccount } from '@universe/api'
import { dataApiServiceClientV1 } from 'uniswap/src/data/apiClients/dataApiService/clients/DataApiClient'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { persistableQueryOptions } from 'utilities/src/reactQuery/persistableQueryOptions'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'

type GetWalletTokenProfitLossInput = {
  input?: WithoutWalletAccount<PartialMessage<GetWalletTokenProfitLossRequest>> & {
    evmAddress?: string
    svmAddress?: string
  }
  enabled?: boolean
}

export function useGetWalletTokenProfitLossQuery(
  params: GetWalletTokenProfitLossInput,
): UseQueryResult<PlainMessage<GetWalletTokenProfitLossResponse> | undefined> {
  const { input, enabled } = params
  const { isTestnetModeEnabled } = useEnabledChains()
  const transformedInput = transformInput(input)
  const address = transformedInput ? transformedInput.walletAccount.platformAddresses[0]?.address : undefined

  return useQuery(
    persistableQueryOptions({
      queryKey: [
        ReactQueryCacheKey.GetWalletTokenProfitLoss,
        address,
        input?.tokenAddress,
        input?.chainId,
        input?.multichain,
        input?.modifier,
      ] as const,
      queryFn: async () =>
        transformedInput
          ? toPlainMessage(await dataApiServiceClientV1.getWalletTokenProfitLoss(transformedInput))
          : undefined,
      enabled: !!input?.tokenAddress && !!address && !isTestnetModeEnabled && enabled !== false,
      staleTime: ONE_MINUTE_MS,
    }),
  )
}
