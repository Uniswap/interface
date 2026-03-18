import type {
  DefinedInitialDataInfiniteOptions,
  UndefinedInitialDataInfiniteOptions,
  UnusedSkipTokenInfiniteOptions,
} from '@tanstack/react-query'
import {
  type DataTag,
  type DefaultError,
  type DefinedInitialDataOptions,
  type InfiniteData,
  type NonUndefinedGuard,
  type QueryKey,
  type UndefinedInitialDataOptions,
  type UnusedSkipTokenOptions,
} from '@tanstack/react-query'

/**
 * QueryOptionsResult
 *
 * Use this to define the result of a function that returns queryOptions.
 *
 * @example
 *
 * ```ts
 * const makeQueryOptions = (
 *   input: InputType,
 * ): QueryOptionsResult<OutputType, Error, OutputType, [ReactQueryCacheKey.Test, InputType]> => {
 *   return queryOptions({
 *     queryKey: [ReactQueryCacheKey.Test, input],
 *     queryFn: async () => ({ output: 'test' }),
 *   })
 * }
 * ```
 */
export type QueryOptionsResult<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  /**
   * The initial data to use for the query. Pass this if using the `initialData` option.
   *
   * @default TQueryFnData
   */
  TInitialData = TQueryFnData | undefined,
> = TInitialData extends undefined
  ? UnusedSkipTokenOptions<TQueryFnData, TError, TData, TQueryKey> & {
      queryKey: DataTag<TQueryKey, TQueryFnData, TError>
    }
  : TInitialData extends NonUndefinedGuard<TQueryFnData> | (() => NonUndefinedGuard<TQueryFnData>)
    ? DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> & {
        queryKey: DataTag<TQueryKey, TQueryFnData, TError>
      }
    : UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> & {
        queryKey: DataTag<TQueryKey, TQueryFnData, TError>
      }

// ------------------------------------------------------------
// queryWithoutCache
// ------------------------------------------------------------

type OmitCacheOptions<T> = Omit<T, 'gcTime' | 'staleTime'>

export function queryWithoutCache<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TInitialData = TQueryFnData | undefined,
>(
  options:
    | OmitCacheOptions<UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>>
    | OmitCacheOptions<DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>>
    | OmitCacheOptions<UnusedSkipTokenOptions<TQueryFnData, TError, TData, TQueryKey>>,
): QueryOptionsResult<TQueryFnData, TError, TData, TQueryKey, TInitialData> {
  return {
    ...options,
    gcTime: 0,
    staleTime: 0,
  } as QueryOptionsResult<TQueryFnData, TError, TData, TQueryKey, TInitialData>
}

/**
 * InfiniteQueryOptionsResult
 *
 * Use this to define the result of a function that returns infiniteQueryOptions.
 *
 * @example
 *
 * ```ts
 * const makeInfiniteQueryOptions = (
 *   input: InputType,
 * ): InfiniteQueryOptionsResult<OutputType, Error, InfiniteData<OutputType>, [ReactQueryCacheKey.Test, InputType], string> => {
 *   return infiniteQueryOptions({
 *     queryKey: [ReactQueryCacheKey.Test, input],
 *     queryFn: async ({ pageParam }) => ({ output: 'test', nextPage: pageParam }),
 *     initialPageParam: undefined,
 *     getNextPageParam: (lastPage) => lastPage.nextPage,
 *   })
 * }
 * ```
 */
export type InfiniteQueryOptionsResult<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
  /**
   * The initial data to use for the query. Pass this if using the `initialData` option.
   *
   * @default InfiniteData<TQueryFnData, TPageParam> | undefined
   */
  TInitialData = InfiniteData<TQueryFnData, TPageParam> | undefined,
> = TInitialData extends undefined
  ? UnusedSkipTokenInfiniteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> & {
      queryKey: DataTag<TQueryKey, InfiniteData<TQueryFnData>, TError>
    }
  : TInitialData extends
        | NonUndefinedGuard<InfiniteData<TQueryFnData, TPageParam>>
        | (() => NonUndefinedGuard<InfiniteData<TQueryFnData, TPageParam>>)
    ? DefinedInitialDataInfiniteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> & {
        queryKey: DataTag<TQueryKey, InfiniteData<TQueryFnData>, TError>
      }
    : UndefinedInitialDataInfiniteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> & {
        queryKey: DataTag<TQueryKey, InfiniteData<TQueryFnData>, TError>
      }
