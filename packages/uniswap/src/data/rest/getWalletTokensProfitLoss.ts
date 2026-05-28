import { PartialMessage } from '@bufbuild/protobuf'
import { createPromiseClient } from '@connectrpc/connect'
import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { DataApiService } from '@uniswap/client-data-api/dist/data/v1/api_connect'
import {
  GetWalletTokensProfitLossRequest,
  GetWalletTokensProfitLossResponse,
} from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { transformInput, WithoutWalletAccount } from '@universe/api'
import { dataApiGetTransport } from 'uniswap/src/data/rest/base'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { persistableQueryOptions } from 'utilities/src/reactQuery/persistableQueryOptions'

const profitLossClient = createPromiseClient(DataApiService, dataApiGetTransport)

type GetWalletTokensProfitLossInput = {
  input?: WithoutWalletAccount<PartialMessage<GetWalletTokensProfitLossRequest>> & {
    evmAddress?: string
    svmAddress?: string
  }
  enabled?: boolean
}

export function useGetWalletTokensProfitLossQuery(
  params: GetWalletTokensProfitLossInput,
): UseQueryResult<GetWalletTokensProfitLossResponse | undefined> {
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
        return await profitLossClient.getWalletTokensProfitLoss(transformedInput)
      },
      enabled: !!address && !isTestnetModeEnabled && enabled !== false,
    }),
  )
}
