import { PartialMessage } from '@bufbuild/protobuf'
import { createPromiseClient } from '@connectrpc/connect'
import { UseQueryResult, useQuery } from '@tanstack/react-query'
import { DataApiService } from '@uniswap/client-data-api/dist/data/v1/api_connect'
import {
  GetWalletTokenProfitLossRequest,
  GetWalletTokenProfitLossResponse,
} from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { transformInput, WithoutWalletAccount } from '@universe/api'
import { dataApiGetTransport } from 'uniswap/src/data/rest/base'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { persistableQueryOptions } from 'utilities/src/reactQuery/persistableQueryOptions'

const profitLossClient = createPromiseClient(DataApiService, dataApiGetTransport)

type GetWalletTokenProfitLossInput = {
  input?: WithoutWalletAccount<PartialMessage<GetWalletTokenProfitLossRequest>> & {
    evmAddress?: string
    svmAddress?: string
  }
  enabled?: boolean
}

export function useGetWalletTokenProfitLossQuery(
  params: GetWalletTokenProfitLossInput,
): UseQueryResult<GetWalletTokenProfitLossResponse | undefined> {
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
      queryFn: () =>
        transformedInput ? profitLossClient.getWalletTokenProfitLoss(transformedInput) : Promise.resolve(undefined),
      enabled: !!input?.tokenAddress && !!address && !isTestnetModeEnabled && enabled !== false,
    }),
  )
}
