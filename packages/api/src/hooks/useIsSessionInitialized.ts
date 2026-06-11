import { useQueryClient } from '@tanstack/react-query'
import { SESSION_INIT_QUERY_KEY } from '@universe/sessions'

/**
 * True once session init has settled (success or error). Treats `error` as
 * initialized to avoid blocking the app forever on a failed init.
 * For the strict variant (only `success`), use `useSessionReady`.
 */
export function useIsSessionInitialized(): boolean {
  const queryClient = useQueryClient()
  const state = queryClient.getQueryState(SESSION_INIT_QUERY_KEY)
  return state?.status === 'success' || state?.status === 'error'
}
