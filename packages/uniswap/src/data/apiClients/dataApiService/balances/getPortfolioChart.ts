import { PartialMessage, PlainMessage, toPlainMessage } from '@bufbuild/protobuf'
import { QueryKey, UseQueryResult, useQuery } from '@tanstack/react-query'
import { GetPortfolioChartRequest, GetPortfolioChartResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { transformInput, WithoutWalletAccount } from '@universe/api'
import { dataApiServiceClientV1 } from 'uniswap/src/data/apiClients/dataApiService/clients/DataApiClient'
import { buildAccountAddressesByPlatform } from 'uniswap/src/data/apiClients/dataApiService/utils/buildAccountAddressesByPlatform'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { persistableQueryOptions } from 'utilities/src/reactQuery/persistableQueryOptions'
import { QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'

export type GetPortfolioChartInput = {
  input?: WithoutWalletAccount<PartialMessage<GetPortfolioChartRequest>> & {
    evmAddress?: string
    svmAddress?: string
  }
} & {
  enabled?: boolean
}

export const getPortfolioHistoricalValueChartQuery = ({
  input,
  enabled = true,
}: GetPortfolioChartInput): QueryOptionsResult<
  PlainMessage<GetPortfolioChartResponse> | undefined,
  Error,
  PlainMessage<GetPortfolioChartResponse> | undefined,
  QueryKey
> => {
  const accountAddressesByPlatform = buildAccountAddressesByPlatform(input)
  const transformedInput = transformInput(input)

  const { walletAccount: _walletAccount, ...inputWithoutWalletAccount } = transformedInput ?? {}

  return persistableQueryOptions({
    queryKey: [ReactQueryCacheKey.GetPortfolioChart, accountAddressesByPlatform, inputWithoutWalletAccount] as const,
    // toPlainMessage strips the Message prototype so the value survives disk persistence.
    queryFn: async (): Promise<PlainMessage<GetPortfolioChartResponse> | undefined> => {
      if (!transformedInput) {
        return Promise.resolve(undefined)
      }

      return toPlainMessage(await dataApiServiceClientV1.getPortfolioChart(transformedInput))
    },
    enabled: !!transformedInput && enabled,
    placeholderData: (prev) => prev,
    staleTime: ONE_MINUTE_MS,
  }) as QueryOptionsResult<
    PlainMessage<GetPortfolioChartResponse> | undefined,
    Error,
    PlainMessage<GetPortfolioChartResponse> | undefined,
    QueryKey
  >
}

/**
 * Wrapper around query for DataApiService/GetPortfolioChart
 * This fetches historical portfolio balance data for charting
 */
export function useGetPortfolioHistoricalValueChartQuery(
  params: GetPortfolioChartInput,
): UseQueryResult<PlainMessage<GetPortfolioChartResponse> | undefined, Error> {
  return useQuery(getPortfolioHistoricalValueChartQuery(params))
}
