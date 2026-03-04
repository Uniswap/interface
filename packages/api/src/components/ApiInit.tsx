import { queryOptions, useQuery } from '@tanstack/react-query'
import { SharedQueryClient } from '@universe/api/src/clients/base/SharedQueryClient'
import type { SessionInitializationService, SessionInitResult } from '@universe/sessions'
import { SessionError } from '@universe/sessions'
import { useState } from 'react'
import type { Logger } from 'utilities/src/logger/logger'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

interface ApiInitProps {
  getSessionInitService: () => SessionInitializationService
  isSessionServiceEnabled: boolean
}

/**
 * Query key for session initialization.
 * Shared between ApiInit (which triggers the query) and InitializationStatusProvider (which observes it).
 */
export const SESSION_INIT_QUERY_KEY = [ReactQueryCacheKey.Session, 'initialization'] as const

function createInitServiceQuery(ctx: {
  getSessionInitService: () => SessionInitializationService
  getLogger?: () => Logger
}): ReturnType<typeof queryOptions<SessionInitResult>> {
  return queryOptions<SessionInitResult>({
    queryKey: SESSION_INIT_QUERY_KEY,
    queryFn: async (): Promise<SessionInitResult> => {
      const service = ctx.getSessionInitService()
      return service.initialize()
    },
    retry: (failureCount, error) => {
      const logger = ctx.getLogger?.()
      // Don't retry any session-related errors - these are terminal errors
      if (error instanceof SessionError) {
        logger?.error(error, {
          tags: {
            file: 'ApiInit.tsx',
            function: 'createInitServiceQuery',
          },
        })
        return false
      }

      logger?.warn('ApiInit.tsx', 'createInitServiceQuery', 'retry', failureCount, error)
      // For other errors (network issues, etc.), retry up to 3 times
      return failureCount < 3
    },
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}

function ApiInit({ getSessionInitService, isSessionServiceEnabled }: ApiInitProps): null {
  const [query] = useState(() => createInitServiceQuery({ getSessionInitService }))

  useQuery({
    ...query,
    enabled: isSessionServiceEnabled,
  })

  return null
}

/** Reinitializes the session by invalidating the session initialization query. Resolves once the query has re-run. */
export async function reinitializeSession(): Promise<void> {
  await SharedQueryClient.invalidateQueries({ queryKey: SESSION_INIT_QUERY_KEY })
}

export { ApiInit }
export type { ApiInitProps }
