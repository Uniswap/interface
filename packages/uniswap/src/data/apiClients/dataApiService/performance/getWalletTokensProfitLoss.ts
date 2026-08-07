import { PartialMessage, PlainMessage, toPlainMessage } from '@bufbuild/protobuf'
import { useQuery, UseQueryResult } from '@tanstack/react-query'
import {
  GetWalletTokensProfitLossRequest,
  GetWalletTokensProfitLossResponse,
} from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { transformInput, WithoutWalletAccount } from '@universe/api'
import { dataApiServiceClientV1 } from 'uniswap/src/data/apiClients/dataApiService/clients/DataApiClient'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { persistableQueryOptions } from 'utilities/src/reactQuery/persistableQueryOptions'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'

type GetWalletTokensProfitLossInput = {
  input?: WithoutWalletAccount<PartialMessage<GetWalletTokensProfitLossRequest>> & {
    evmAddress?: string
    svmAddress?: string
  }
  enabled?: boolean
}

export function useGetWalletTokensProfitLossQuery(
  params: GetWalletTokensProfitLossInput,
): UseQueryResult<PlainMessage<GetWalletTokensProfitLossResponse> | undefined> {
  const { input, enabled } = params
  const { isTestnetModeEnabled } = useEnabledChains()
  const transformedInput = transformInput(input)
  const address = transformedInput ? transformedInput.walletAccount.platformAddresses[0]?.address : undefined

  return useQuery(
    persistableQueryOptions({
      queryKey: [
        ReactQueryCacheKey.GetWalletTokensProfitLoss,
        address,
        input?.chainIds,
        input?.multichain,
        input?.modifier,
      ] as const,
      queryFn: async () => {
        if (!transformedInput) {
          return undefined
        }
        return toPlainMessage(await dataApiServiceClientV1.getWalletTokensProfitLoss(transformedInput))
      },
      enabled: !!address && !isTestnetModeEnabled && enabled !== false,
      staleTime: ONE_MINUTE_MS,
    }),
  )
}
