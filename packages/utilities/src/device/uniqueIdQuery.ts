import { UseQueryOptions } from '@tanstack/react-query'
import { getUniqueId } from 'utilities/src/device/uniqueId'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

export function uniqueIdQuery(): UseQueryOptions<string> {
  return {
    queryKey: [ReactQueryCacheKey.UniqueId],
    queryFn: getUniqueId,
    staleTime: Infinity,
    gcTime: Infinity,
  }
}
