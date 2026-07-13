import { queryOptions } from '@tanstack/react-query'
import type {
  SessionInitializationService,
  SessionInitResult,
} from '@universe/sessions/src/session-initialization/createSessionInitializationService'
import { SessionError } from '@universe/sessions/src/session-initialization/sessionErrors'
import type { Logger } from 'utilities/src/logger/logger'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import type { QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'

export const SESSION_INIT_QUERY_KEY = [ReactQueryCacheKey.Session, 'initialization'] as const

export type SessionInitQueryOptions = QueryOptionsResult<
  SessionInitResult,
  Error,
  SessionInitResult,
  typeof SESSION_INIT_QUERY_KEY
>

/**
 * Query options for session initialization. Consumed by both `useQuery`
 * (in `ApiInit`) and `fetchQuery` (in the session gate adapter).
 *
 * Retry policy: `SessionError` is terminal (no retry); network errors
 * retry up to 3× with exponential backoff. Refetch-on-mount/focus/reconnect
 * is disabled — recovery is driven explicitly via `provideSession().recover()`.
 */
export function sessionInitQuery(ctx: {
  getService: () => SessionInitializationService
  getLogger?: () => Logger
}): SessionInitQueryOptions {
  return queryOptions({
    queryKey: SESSION_INIT_QUERY_KEY,
    queryFn: (): Promise<SessionInitResult> => ctx.getService().initialize(),
    retry: (failureCount, error): boolean => {
      const logger = ctx.getLogger?.()
      if (error instanceof SessionError) {
        logger?.error(error, { tags: { file: 'sessionInitQuery.ts', function: 'retry' } })
        return false
      }
      logger?.warn('sessionInitQuery.ts', 'retry', 'Session init failed; scheduling retry', { failureCount, error })
      return failureCount < 3
    },
    retryDelay: (attemptIndex: number): number => Math.min(1000 * 2 ** attemptIndex, 30000),
    // Recovery is driven explicitly via `session.recover()` — never via staleness.
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}
