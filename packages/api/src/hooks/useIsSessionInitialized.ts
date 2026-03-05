import { useQueryClient } from '@tanstack/react-query'
import { SESSION_INIT_QUERY_KEY } from '@universe/api/src/components/ApiInit'

/**
 * Hook to check if session initialization is complete.
 * Use this to gate API calls that require an authenticated session.
 *
 * @returns true if session init query has completed (success or error), false if pending or not started
 */
export function useIsSessionInitialized(): boolean {
  const queryClient = useQueryClient()
  const state = queryClient.getQueryState(SESSION_INIT_QUERY_KEY)

  // Session is initialized if the query exists and is not in pending/fetching state
  // We consider both success and error as "initialized" since we don't want to block forever
  return state?.status === 'success' || state?.status === 'error'
}
