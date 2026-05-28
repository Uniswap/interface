import { queryOptions } from '@tanstack/react-query'
import type { UniswapIdentifierService } from '@universe/sessions/src/uniswap-identifier/types'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import type { QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'

type UniswapIdentifierQueryOptions = QueryOptionsResult<
  string | null,
  Error,
  string | null,
  [ReactQueryCacheKey.UniswapIdentifier]
>

export function uniswapIdentifierQuery(getService: () => UniswapIdentifierService): UniswapIdentifierQueryOptions {
  return queryOptions({
    queryKey: [ReactQueryCacheKey.UniswapIdentifier],
    queryFn: async () => getService().getUniswapIdentifier(),
    staleTime: Infinity,
    gcTime: Infinity,
  })
}
