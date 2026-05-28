import { QueryClient } from '@tanstack/react-query'

export interface QueryClientConfig {
  /** How long data is "fresh" before refetching (default: 30_000ms) */
  staleTime?: number
  /** How long unused data stays in cache (default: 24 hours) */
  gcTime?: number
  /** Refetch when window regains focus (default: true) */
  refetchOnWindowFocus?: boolean
  /** Refetch when component mounts (default: true) */
  refetchOnMount?: boolean
  /** Refetch when network reconnects (default: true) */
  refetchOnReconnect?: boolean
  /** Optional logger for retry warnings */
  logger?: {
    warn: (message: string, context?: Record<string, unknown>) => void
  }
}

/**
 * Creates a new QueryClient with configurable defaults.
 */
export function createQueryClient(config?: QueryClientConfig): QueryClient {
  const {
    staleTime = 30_000,
    gcTime = 24 * 60 * 60 * 1000,
    refetchOnWindowFocus = true,
    refetchOnMount = true,
    refetchOnReconnect = true,
    logger,
  } = config ?? {}

  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime,
        gcTime,
        refetchOnWindowFocus,
        refetchOnMount,
        refetchOnReconnect,
        retry: (failureCount, error): boolean => {
          if (failureCount >= 2) {
            return false
          }
          if (error instanceof Error && 'status' in error) {
            const status = (error as { status: number }).status
            if (status >= 500) {
              logger?.warn('retrying request', { attempt: failureCount + 1, status })
              return true
            }
          }
          return false
        },
      },
    },
  })
}
