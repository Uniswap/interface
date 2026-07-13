import type { RWAIssuer } from 'uniswap/src/features/rwa/types'

// Capitalize the data-API issuer string so new issuers need no front-end change.
export function getRWAIssuerDisplayName(issuer: RWAIssuer): string {
  return issuer.length ? issuer.charAt(0).toUpperCase() + issuer.slice(1) : issuer
}
