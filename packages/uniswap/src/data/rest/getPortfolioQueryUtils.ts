import { type PlainMessage } from '@bufbuild/protobuf'
import { type Query } from '@tanstack/react-query'
import { type GetPortfolioResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { SharedQueryClient } from '@universe/api'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

/**
 * Checks if a `GetPortfolio` query key matches the given address and platform.
 * Used to find active queries that need to be updated after a transaction.
 * Query key format (from api package): [GetPortfolio, { evmAddress?, svmAddress? }, queryCacheInputs]
 */
export function doesGetPortfolioQueryMatchAddress({
  queryKey,
  address,
  platform,
}: {
  queryKey: readonly unknown[]
  address: string
  platform: Platform
}): boolean {
  const [key, addressKey] = queryKey

  if (key !== ReactQueryCacheKey.GetPortfolio || typeof addressKey !== 'object' || addressKey === null) {
    return false
  }

  const keyWithAddresses = addressKey as { evmAddress?: string; svmAddress?: string }
  const queryAddress = platform === Platform.EVM ? keyWithAddresses.evmAddress : keyWithAddresses.svmAddress

  if (!queryAddress) {
    return false
  }

  return areAddressesEqual({
    addressInput1: { address, platform },
    addressInput2: { address: queryAddress, platform },
  })
}

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
