import type { RankedMultichainToken } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { findRWAMatch, type RWAMatch } from 'uniswap/src/features/rwa/rwaMatch'
import { type RWAWhitelist, UNKNOWN_RWA_ISSUER } from 'uniswap/src/features/rwa/types'

/**
 * Matches on every deployment because the registry keeps one (mainnet-preferred) token per issuer and
 * matching is per chain; a grouping whose row identity is another leg still matches through that one.
 * Issuer-less registry entries (commodities) get no match, so they render as plain tokens.
 */
export function findRankedTokenRWAMatch({
  multichainToken,
  rwaWhitelist,
}: {
  multichainToken: NonNullable<RankedMultichainToken['multichainToken']>
  rwaWhitelist: RWAWhitelist
}): RWAMatch | undefined {
  const candidates = Object.entries(multichainToken.addresses).map(([chainId, address]) => ({
    chainId: Number(chainId),
    address,
  }))
  const match = findRWAMatch({ rwaWhitelist, candidates })
  return match?.token.issuer === UNKNOWN_RWA_ISSUER ? undefined : match
}
