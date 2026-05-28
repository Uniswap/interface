import ms from 'ms'
import { useEffect, useState } from 'react'
import { useInterval } from 'utilities/src/time/timing'

export const REQUEST_EXPIRY_TIME_MS = ms('30m')

export function isRequestStale(createdAt: number): boolean {
  return Date.now() - createdAt >= REQUEST_EXPIRY_TIME_MS
}

/**
 * Hook that monitors whether a request has become stale (older than REQUEST_EXPIRY_TIME_MS).
 *
 * @param createdAt - Timestamp when the request was created (in milliseconds)
 * @returns boolean indicating whether the request is stale
 */
export function useIsRequestStale(createdAt: number): boolean {
  const [isStale, setIsStale] = useState(() => isRequestStale(createdAt))

  useEffect(() => {
    setIsStale(isRequestStale(createdAt))
  }, [createdAt])

  useInterval(
    () => {
      setIsStale(isRequestStale(createdAt))
    },
    1000,
    true,
  )

  return isStale
}
