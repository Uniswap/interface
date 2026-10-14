import type { RankedMultichainToken } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { mapTokenIssuerInfo } from 'uniswap/src/features/rwa/issuers'
import { findRWAMatch, type RWAMatch } from 'uniswap/src/features/rwa/rwaMatch'
import { type RWAIssuerDisplay, type RWAWhitelist, UNKNOWN_RWA_ISSUER } from 'uniswap/src/features/rwa/types'

export type RankedTokenIssuer = {
  /** Registry match, when the token is a whitelisted RWA; drives the clean asset name. */
  rwaMatch?: RWAMatch
  /** Issuer to render as the row tag, from the registry or the backend's per-token issuer. */
  issuer?: RWAIssuerDisplay
}

/**
 * Registry first, matched on every deployment: the registry keeps one (mainnet-preferred) token per issuer
 * and matches per chain, so a grouping whose row identity is another leg still matches through that one.
 * Tokens the registry doesn't attribute (commodities) fall back to the backend's per-token issuer.
 */
export function resolveRankedTokenIssuer({
  multichainToken,
  rwaWhitelist,
}: {
  multichainToken: NonNullable<RankedMultichainToken['multichainToken']>
  rwaWhitelist: RWAWhitelist
}): RankedTokenIssuer {
  const candidates = Object.entries(multichainToken.addresses).map(([chainId, address]) => ({
    chainId: Number(chainId),
    address,
  }))
  const rwaMatch = findRWAMatch({ rwaWhitelist, candidates })
  const registryIssuer = rwaMatch && rwaMatch.token.issuer !== UNKNOWN_RWA_ISSUER ? rwaMatch.token : undefined
  const backendIssuer = mapTokenIssuerInfo(multichainToken.issuer)
  if (!registryIssuer) {
    return { rwaMatch, issuer: backendIssuer.issuer === UNKNOWN_RWA_ISSUER ? undefined : backendIssuer }
  }
  // The v1 registry carries only the slug; the backend's per-token issuer brings the display name and logo.
  return {
    rwaMatch,
    issuer: {
      issuer: registryIssuer.issuer,
      issuerDisplayName: registryIssuer.issuerDisplayName ?? backendIssuer.issuerDisplayName,
      issuerLogoUrl: registryIssuer.issuerLogoUrl ?? backendIssuer.issuerLogoUrl,
    },
  }
}
