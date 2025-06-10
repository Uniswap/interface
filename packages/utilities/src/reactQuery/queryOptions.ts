import { UseQueryOptions } from '@tanstack/react-query'

export function queryWithoutCache<T>(queryOptions: UseQueryOptions<T>): UseQueryOptions<T> {
  return {
    ...queryOptions,
    gcTime: 0,
    staleTime: 0,
  }
}
