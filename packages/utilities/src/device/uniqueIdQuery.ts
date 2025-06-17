import { queryOptions } from '@tanstack/react-query'
import { getUniqueId } from 'utilities/src/device/uniqueId'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import type { QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'

type UniqueIdQueryOptions = QueryOptionsResult<string, Error, string, [ReactQueryCacheKey.UniqueId]>

export function uniqueIdQuery(): UniqueIdQueryOptions {
  return queryOptions({
    queryKey: [ReactQueryCacheKey.UniqueId],
    queryFn: getUniqueId,
    staleTime: Infinity,
    gcTime: Infinity,
  })
}
