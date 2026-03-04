import { type PartialMessage } from '@bufbuild/protobuf'
import { queryOptions } from '@tanstack/react-query'
import type { GetPortfolioRequest, GetPortfolioResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { type DataApiServiceClient } from '@universe/api/src/clients/dataApi/createDataApiServiceClient'
import { transformInput, type WithoutWalletAccount } from '@universe/api/src/connectRpc/utils'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { type QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'

/**
 * Sorts `chainIds` in a query cache inputs object so that the same logical input
 * produces a stable cache key regardless of array order.
 */
function isNumberArray(arr: unknown): arr is number[] {
  return Array.isArray(arr) && arr.every((id): id is number => typeof id === 'number')
}

function sortQueryCacheInputs(inputs: Record<string, unknown>): Record<string, unknown> {
  const result = { ...inputs }
  if (isNumberArray(result['chainIds'])) {
    result['chainIds'] = [...result['chainIds']].sort((a, b) => a - b)
  }
  return result
}

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
): QueryOptionsResult<GetPortfolioResponse | undefined, Error, GetPortfolioResponse | undefined, GetPortfolioQueryKey> {
  const transformedInput = transformInput(input)

  const { modifier: _modifier, walletAccount: _walletAccount, ...queryCacheInputs } = transformedInput ?? {}

  const queryCacheInputsSorted = sortQueryCacheInputs(queryCacheInputs)

  const addressKey = {
    ...(input?.evmAddress && { evmAddress: input.evmAddress }),
    ...(input?.svmAddress && { svmAddress: input.svmAddress }),
  }

  return queryOptions({
    queryKey: [ReactQueryCacheKey.GetPortfolio, addressKey, queryCacheInputsSorted] as const,
    queryFn: async (): Promise<GetPortfolioResponse | undefined> => {
      if (!transformedInput) {
        return undefined
      }
      const response: GetPortfolioResponse = await client.getPortfolio(
        transformedInput as PartialMessage<GetPortfolioRequest>,
      )
      return response
    },
    placeholderData: (prev: GetPortfolioResponse | undefined) => prev,
  })
}
