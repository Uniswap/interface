import {
  type DataTag,
  type DefaultError,
  type DefinedInitialDataOptions,
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
