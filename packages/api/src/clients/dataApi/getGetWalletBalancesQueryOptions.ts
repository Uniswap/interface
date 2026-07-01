import { type PartialMessage, type PlainMessage, toPlainMessage } from '@bufbuild/protobuf'
import type { GetWalletBalancesRequest, GetWalletBalancesResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { type DataApiServiceClient } from '@universe/api/src/clients/dataApi/createDataApiServiceClient'
import { transformInput, type WithoutWalletAccount } from '@universe/api/src/connectRpc/utils'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { persistableQueryOptions } from 'utilities/src/reactQuery/persistableQueryOptions'
import { type QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'

/** Input used to build queryKey and queryFn. Config (enabled, refetchInterval, select) is applied by the caller. */
export type GetWalletBalancesQueryParams = {
  input?: WithoutWalletAccount<PartialMessage<GetWalletBalancesRequest>> & {
    evmAddress?: string
    svmAddress?: string
  }
}

type GetWalletBalancesQueryKey = readonly [
  ReactQueryCacheKey.GetWalletBalances,
  { evmAddress?: string; svmAddress?: string },
  Record<string, unknown>,
]

/**
 * Returns React Query options for DataApiService GetWalletBalances (queryKey, queryFn, placeholderData only).
 * Callers should merge in config (enabled, refetchInterval, select) when building the final options.
 */
export function getGetWalletBalancesQueryOptions(
  client: DataApiServiceClient,
  { input }: GetWalletBalancesQueryParams,
): QueryOptionsResult<
  PlainMessage<GetWalletBalancesResponse> | undefined,
  Error,
  PlainMessage<GetWalletBalancesResponse> | undefined,
  GetWalletBalancesQueryKey
> {
  const transformedInput = transformInput(input)

  const { modifier: _modifier, walletAccount: _walletAccount, ...queryCacheInputs } = transformedInput ?? {}

  const addressKey = {
    ...(input?.evmAddress && { evmAddress: input.evmAddress }),
    ...(input?.svmAddress && { svmAddress: input.svmAddress }),
  }

  return persistableQueryOptions({
    queryKey: [ReactQueryCacheKey.GetWalletBalances, addressKey, queryCacheInputs] as const,
    queryFn: async (): Promise<PlainMessage<GetWalletBalancesResponse> | undefined> => {
      if (!transformedInput) {
        return undefined
      }
      const response: GetWalletBalancesResponse = await client.getWalletBalances(
        transformedInput as PartialMessage<GetWalletBalancesRequest>,
      )
      return toPlainMessage(response)
    },
    placeholderData: (prev: PlainMessage<GetWalletBalancesResponse> | undefined) => prev,
  })
}
