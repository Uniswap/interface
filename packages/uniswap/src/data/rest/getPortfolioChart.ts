import { PartialMessage } from '@bufbuild/protobuf'
import { createPromiseClient } from '@connectrpc/connect'
import { QueryKey, UseQueryResult, useQuery } from '@tanstack/react-query'
import { DataApiService } from '@uniswap/client-data-api/dist/data/v1/api_connect'
import { GetPortfolioChartRequest, GetPortfolioChartResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { transformInput, WithoutWalletAccount } from '@universe/api'
import { entryGatewayPostTransport } from 'uniswap/src/data/rest/base'
import { buildAccountAddressesByPlatform } from 'uniswap/src/data/rest/buildAccountAddressesByPlatform'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { persistableQueryOptions } from 'utilities/src/reactQuery/persistableQueryOptions'
import { QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'

export type GetPortfolioChartInput = {
  input?: WithoutWalletAccount<PartialMessage<GetPortfolioChartRequest>> & {
    evmAddress?: string
    svmAddress?: string
  }
} & {
  enabled?: boolean
}

const portfolioChartClient = createPromiseClient(DataApiService, entryGatewayPostTransport)

export const getPortfolioHistoricalValueChartQuery = ({
  input,
  enabled = true,
}: GetPortfolioChartInput): QueryOptionsResult<
  GetPortfolioChartResponse | undefined,
  Error,
  GetPortfolioChartResponse | undefined,
  QueryKey
> => {
  const accountAddressesByPlatform = buildAccountAddressesByPlatform(input)
  const transformedInput = transformInput(input)

  const { walletAccount: _walletAccount, ...inputWithoutWalletAccount } = transformedInput ?? {}

  return persistableQueryOptions({
    queryKey: [ReactQueryCacheKey.GetPortfolioChart, accountAddressesByPlatform, inputWithoutWalletAccount] as const,
    queryFn: async (): Promise<GetPortfolioChartResponse | undefined> => {
      if (!transformedInput) {
        return Promise.resolve(undefined)
      }

      const result = await portfolioChartClient.getPortfolioChart(transformedInput)
      return result as GetPortfolioChartResponse
    },
    enabled: !!transformedInput && enabled,
    placeholderData: (prev) => prev,
  }) as QueryOptionsResult<
    GetPortfolioChartResponse | undefined,
    Error,
    GetPortfolioChartResponse | undefined,
    QueryKey
  >
}

/**
 * Wrapper around query for DataApiService/GetPortfolioChart
 * This fetches historical portfolio balance data for charting
 */
export function useGetPortfolioHistoricalValueChartQuery(
  params: GetPortfolioChartInput,
): UseQueryResult<GetPortfolioChartResponse | undefined, Error> {
  return useQuery(getPortfolioHistoricalValueChartQuery(params))
}
