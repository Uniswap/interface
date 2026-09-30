import type { UseQueryResult } from '@tanstack/react-query'

/**
 * The subset of TanStack's `UseQueryResult` that a hook can honestly provide when it derives its value from
 * several queries, or enriches one query's data with other hooks. Such a hook has no single `status` /
 * `fetchStatus` to report, so it exposes only the fields consumers read.
 *
 * Any `UseQueryResult` is assignable to this, so a hook that wraps exactly one query should return
 * `UseQueryResult` directly and let callers pick the flags they need.
 */
export type DerivedQueryResult<TData, TError = Error> = Pick<
  UseQueryResult<TData, TError>,
  'data' | 'error' | 'isLoading'
> & {
  refetch?: () => void
}
