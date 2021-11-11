export function isStale(lastUpdate, staleTime) {
  // since we fork a specific block, assume never stale in e2e tests
  return false
}
