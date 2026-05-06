import type {
  DefaultError,
  InfiniteData,
  QueryKey,
  UndefinedInitialDataInfiniteOptions,
  UndefinedInitialDataOptions,
} from '@tanstack/react-query'
import type { InfiniteQueryOptionsResult, QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'

/**
 * Wrapper around `queryOptions` that tags the query with `meta.persist: true`
 * so `shouldDehydrateQuery` opts it into disk persistence.
 *
 * Prefer this over spelling `meta: { persist: true }` on a raw `queryOptions`
 * call — every opt-in becomes greppable as `persistableQueryOptions(`.
 */
export function persistableQueryOptions<
  TQueryFnData,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
): QueryOptionsResult<TQueryFnData, TError, TData, TQueryKey> {
  return {
    ...options,
    meta: { ...options.meta, persist: true },
  } as unknown as QueryOptionsResult<TQueryFnData, TError, TData, TQueryKey>
}

/** See {@link persistableQueryOptions}. Infinite-query variant. */
export function persistableInfiniteQueryOptions<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: UndefinedInitialDataInfiniteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>,
): InfiniteQueryOptionsResult<TQueryFnData, TError, TData, TQueryKey, TPageParam> {
  return {
    ...options,
    meta: { ...options.meta, persist: true },
  } as unknown as InfiniteQueryOptionsResult<TQueryFnData, TError, TData, TQueryKey, TPageParam>
}
