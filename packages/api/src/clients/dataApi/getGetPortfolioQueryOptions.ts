import { type PartialMessage, type PlainMessage, toPlainMessage } from '@bufbuild/protobuf'
import type { GetPortfolioRequest, GetPortfolioResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { type DataApiServiceClient } from '@universe/api/src/clients/dataApi/createDataApiServiceClient'
import { transformInput, type WithoutWalletAccount } from '@universe/api/src/connectRpc/utils'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { persistableQueryOptions } from 'utilities/src/reactQuery/persistableQueryOptions'
import { type QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'

/** Input used to build queryKey and queryFn. Config (enabled, refetchInterval, select) is applied by the caller. */
export type GetPortfolioQueryParams = {
  input?: WithoutWalletAccount<PartialMessage<GetPortfolioRequest>> & {
    evmAddress?: string
    svmAddress?: string
  }
}

type GetPortfolioQueryKey = readonly [
  ReactQueryCacheKey.GetPortfolio,
  { evmAddress?: string; svmAddress?: string },
  Record<string, unknown>,
]

/**
 * Returns React Query options for DataApiService GetPortfolio (queryKey, queryFn, placeholderData only).
 * Callers should merge in config (enabled, refetchInterval, select) when building the final options.
 *
 * @example
 * const client = createDataApiServiceClient({ rpcClient: createPromiseClient(DataApiService, transport) })
 * const baseOptions = getGetPortfolioQueryOptions(client, { input: { evmAddress, chainIds } })
 * const { data } = useQuery({ ...baseOptions, enabled, select })
 */
export function getGetPortfolioQueryOptions(
  client: DataApiServiceClient,
  { input }: GetPortfolioQueryParams,
): QueryOptionsResult<
  PlainMessage<GetPortfolioResponse> | undefined,
  Error,
  PlainMessage<GetPortfolioResponse> | undefined,
  GetPortfolioQueryKey
> {
  const transformedInput = transformInput(input)

  const { modifier: _modifier, walletAccount: _walletAccount, ...queryCacheInputs } = transformedInput ?? {}

  const addressKey = {
    ...(input?.evmAddress && { evmAddress: input.evmAddress }),
    ...(input?.svmAddress && { svmAddress: input.svmAddress }),
  }

  return persistableQueryOptions({
    queryKey: [ReactQueryCacheKey.GetPortfolio, addressKey, queryCacheInputs] as const,
    queryFn: async (): Promise<PlainMessage<GetPortfolioResponse> | undefined> => {
      if (!transformedInput) {
        return undefined
      }
      const response: GetPortfolioResponse = await client.getPortfolio(
        transformedInput as PartialMessage<GetPortfolioRequest>,
      )
      return toPlainMessage(response)
    },
    placeholderData: (prev: PlainMessage<GetPortfolioResponse> | undefined) => prev,
  })
}
