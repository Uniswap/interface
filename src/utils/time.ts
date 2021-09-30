export function isStale(lastUpdated: number | null, staleTime: number) {
  return !lastUpdated || Date.now() - lastUpdated > staleTime
}
