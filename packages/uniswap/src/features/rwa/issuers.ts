import type { PlainMessage } from '@bufbuild/protobuf'
import type { TokenIssuerInfo } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import {
  type RWAIssuer,
  type RWAIssuerDisplay,
  type RWAToken,
  UNKNOWN_RWA_ISSUER,
} from 'uniswap/src/features/rwa/types'

/** Data-API issuer slugs are matched case-insensitively; blank means the unknown-issuer sentinel. */
export function normalizeRWAIssuer(issuer: string): RWAIssuer {
  return issuer.trim().toLowerCase() || UNKNOWN_RWA_ISSUER
}

/** Backend issuer branding as RWA token issuer fields; an absent issuer maps to the unknown slug. */
export function mapTokenIssuerInfo(issuer: PlainMessage<TokenIssuerInfo> | undefined): RWAIssuerDisplay {
  return {
    issuer: normalizeRWAIssuer(issuer?.id ?? ''),
    issuerDisplayName: issuer?.displayName || undefined,
    issuerLogoUrl: issuer?.logoUrl || undefined,
  }
}

// Capitalize the data-API issuer string so new issuers need no front-end change.
export function getRWAIssuerDisplayName(issuer: RWAIssuer): string {
  return issuer.length ? issuer.charAt(0).toUpperCase() + issuer.slice(1) : issuer
}

/**
 * Backend display name when present, else the capitalized slug. Undefined for the unknown sentinel so
 * callers hide the label.
 */
export function getRWAIssuerLabel(token: Pick<RWAToken, 'issuer' | 'issuerDisplayName'>): string | undefined {
  if (token.issuerDisplayName) {
    return token.issuerDisplayName
  }
  return token.issuer === UNKNOWN_RWA_ISSUER ? undefined : getRWAIssuerDisplayName(token.issuer)
}
