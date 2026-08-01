// Emit each metadata-failure signal at most once per token per session:
// useAuctionTokenInfo is mounted by multiple components on an auction page and
// re-renders with every poll, so per-render logging would flood Datadog and
// skew failure counts.
const loggedCorruptMetadataTokens = new Set<string>()
const loggedUnresolvedDecimalsTokens = new Set<string>()

/** Returns true the first time it is called for a given currencyId this session, false afterwards. */
export function shouldLogCorruptMetadataOnce(currencyId: string): boolean {
  if (loggedCorruptMetadataTokens.has(currencyId)) {
    return false
  }
  loggedCorruptMetadataTokens.add(currencyId)
  return true
}

/** Returns true the first time it is called for a given currencyId this session, false afterwards. */
export function shouldLogUnresolvedDecimalsOnce(currencyId: string): boolean {
  if (loggedUnresolvedDecimalsTokens.has(currencyId)) {
    return false
  }
  loggedUnresolvedDecimalsTokens.add(currencyId)
  return true
}

/** Test-only: clears the once-per-session log dedupe guards. */
export function resetAuctionTokenInfoLogGuards(): void {
  loggedCorruptMetadataTokens.clear()
  loggedUnresolvedDecimalsTokens.clear()
}
