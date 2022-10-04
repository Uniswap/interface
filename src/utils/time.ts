export const ONE_SECOND_MS = 1000
export const ONE_MINUTE_MS = 60 * ONE_SECOND_MS
export const ONE_HOUR_MS = 60 * ONE_MINUTE_MS
export const ONE_DAY_MS = 24 * ONE_HOUR_MS

export function isStale(lastUpdated: number | null, staleTime: number) {
  return !lastUpdated || Date.now() - lastUpdated > staleTime
}
