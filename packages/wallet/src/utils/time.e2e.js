export function isStale() {
  // since we fork a specific block, assume never stale in e2e tests
  return false
}
