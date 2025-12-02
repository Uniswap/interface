import { queryOptions, useQuery } from '@tanstack/react-query'
import { getIsSessionServiceEnabled } from '@universe/api/src/getIsSessionServiceEnabled'
import type { SessionInitializationService, SessionInitResult } from '@universe/sessions'
import { SessionError } from '@universe/sessions'
import { useMemo } from 'react'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

interface ApiInitProps {
  sessionInitService: SessionInitializationService
}

function createInitServiceQuery(ctx: {
  sessionInitService: SessionInitializationService
}): ReturnType<typeof queryOptions<SessionInitResult>> {
  return queryOptions<SessionInitResult>({
    queryKey: [ReactQueryCacheKey.Session, 'initialization'],
    queryFn: async (): Promise<SessionInitResult> => {
      return await ctx.sessionInitService.initialize()
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

function ApiInit({ sessionInitService }: ApiInitProps): null {
  const query = useMemo(() => createInitServiceQuery({ sessionInitService }), [sessionInitService])

  // Short-circuit if session service is disabled
  const shouldInitialize = getIsSessionServiceEnabled()

  useQuery({
    ...query,
    enabled: shouldInitialize,
  })

  return null
}

export { ApiInit }
export type { ApiInitProps }
