import { WatchQueryFetchPolicy } from '@apollo/client'

const keys = new Map<string, number>()

export const getFetchPolicyForKey = (key: string, expirationMs: number): WatchQueryFetchPolicy => {
  const lastFetchTimestamp = keys.get(key)
  const diffFromNow = lastFetchTimestamp ? Date.now() - lastFetchTimestamp : Number.MAX_SAFE_INTEGER
  let fetchPolicy: WatchQueryFetchPolicy = 'cache-first'

  if (diffFromNow > expirationMs) {
    keys.set(key, Date.now())
    fetchPolicy = 'network-only'
  }

  return fetchPolicy
}
