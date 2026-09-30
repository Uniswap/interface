import type { FetchStatus } from '@tanstack/react-query'

/**
 * Keeps pending queries loading while paused offline, but excludes disabled idle queries.
 * Unlike `isPending`, this excludes idle queries; unlike `isLoading`, it includes paused queries.
 */
export function isQueryLoading({ isPending, fetchStatus }: { isPending: boolean; fetchStatus: FetchStatus }): boolean {
  return isPending && fetchStatus !== 'idle'
}
