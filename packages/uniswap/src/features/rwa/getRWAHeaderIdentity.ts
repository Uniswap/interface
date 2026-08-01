import type { RWAMatch } from 'uniswap/src/features/rwa/rwaMatch'

/**
 * TDP header identity, shared by the web and mobile Token Details Page headers.
 *
 * For a matched RWA, show the underlying asset's name but keep the token's OWN logo — never the
 * shared canonical RWA asset icon (`asset.icon`), which is identical across every issuer of that
 * asset and would render the group logo for a specific issuer's token (e.g. a Robinhood-issued
 * stock showing the shared stock logo).
 */
export function getRWAHeaderIdentity({
  rwaMatch,
  fallbackName,
  logoUrl,
}: {
  rwaMatch: RWAMatch | undefined
  fallbackName: string | undefined
  logoUrl: string | undefined
}): { name: string | undefined; logoUrl: string | undefined } {
  if (rwaMatch) {
    return { name: rwaMatch.asset.name || rwaMatch.asset.symbol, logoUrl }
  }
  return { name: fallbackName, logoUrl }
}
