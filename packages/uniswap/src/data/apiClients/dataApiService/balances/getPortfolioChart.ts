import { type PlainMessage } from '@bufbuild/protobuf'
import { type UseQueryResult, useQuery } from '@tanstack/react-query'
import { type GetPortfolioChartResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { type GetPortfolioChartInput, getPortfolioChartQueryOptions } from '@universe/data-api'
import { dataApiServiceClientV1 } from 'uniswap/src/data/apiClients/dataApiService/clients/DataApiClient'

export function getPortfolioHistoricalValueChartQuery(
  params: GetPortfolioChartInput,
): ReturnType<typeof getPortfolioChartQueryOptions> {
  return getPortfolioChartQueryOptions(dataApiServiceClientV1, params)
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
