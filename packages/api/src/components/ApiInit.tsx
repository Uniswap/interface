import { queryOptions, useQuery } from '@tanstack/react-query'
import type { SessionInitializationService, SessionInitResult } from '@universe/sessions'
import { SessionError } from '@universe/sessions'
import { useState } from 'react'
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
}): ReturnType<typeof queryOptions<SessionInitResult>> {
  return queryOptions<SessionInitResult>({
    queryKey: SESSION_INIT_QUERY_KEY,
    queryFn: async (): Promise<SessionInitResult> => {
      return await ctx.getSessionInitService().initialize()
    },
    retry: (failureCount, error) => {
      // Don't retry any session-related errors - these are terminal errors
      if (error instanceof SessionError) {
        return false
      }
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

export { ApiInit }
export type { ApiInitProps }
