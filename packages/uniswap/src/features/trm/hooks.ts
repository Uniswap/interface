import { useTrmScreenQuery } from 'uniswap/src/data/apiClients/uniswapApi/useTrmScreenQuery'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'

export interface IsBlockedResult {
  isBlockedLoading: boolean
  isBlocked: boolean
}

/** Returns TRM status for an address that has been passed in. */
export function useIsBlocked(address?: string, isViewOnly = false): IsBlockedResult {
  const shouldSkip = !address || isViewOnly

  const { data, isLoading } = useTrmScreenQuery({
    params: shouldSkip ? undefined : { address },
    staleTime: 5 * ONE_MINUTE_MS,
  })

  return {
    isBlocked: data?.block || false,
    isBlockedLoading: isLoading,
  }
}
