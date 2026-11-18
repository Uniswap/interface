import { type PlainMessage } from '@bufbuild/protobuf'
import { type Query } from '@tanstack/react-query'
import { type GetPortfolioResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { SharedQueryClient } from '@universe/api'
import { type Platform } from '@universe/chains'
import { doesGetPortfolioQueryMatchAddress } from '@universe/data-api'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

/**
 * Finds all active `GetPortfolio` queries that match the given address and platform.
 * Returns the array of matching queries to update.
 */
export function getPortfolioQueriesToUpdate({
  address,
  platform,
}: {
  address: string
  platform: Platform
}): Query<PlainMessage<GetPortfolioResponse> | undefined, Error>[] {
  const activePortfolioQueries = SharedQueryClient.getQueryCache().findAll({
    queryKey: [ReactQueryCacheKey.GetPortfolio],
    type: 'active',
  })

  return activePortfolioQueries.filter((query) =>
    doesGetPortfolioQueryMatchAddress({ queryKey: query.queryKey, address, platform }),
  ) as Query<PlainMessage<GetPortfolioResponse> | undefined, Error>[]
}
