import type { ListRwasAssetSource, ListRwasIssuerData } from 'uniswap/src/data/rest/rwa/types'
import { logger } from 'utilities/src/logger/logger'

/**
 * Resolves a `ListRwas` issuer token's display data ({name,symbol,logoUrl}), keyed by the raw issuer string:
 * - issuer present in `issuerData` → that entry.
 * - empty/whitespace issuer (commodities carry an empty issuer + empty `issuerData`) → asset-level display, silently.
 * - non-empty issuer absent from `issuerData` → contract violation: log and return `undefined` (caller drops it).
 */
export function resolveRwaIssuerDisplay({
  asset,
  token,
}: {
  asset: Pick<ListRwasAssetSource, 'symbol' | 'name' | 'logoUrl' | 'issuerData'>
  token: { issuer: string }
}): ListRwasIssuerData | undefined {
  const data = asset.issuerData[token.issuer]
  if (data) {
    return data
  }

  if (token.issuer.trim() === '') {
    return { name: asset.name, symbol: asset.symbol, logoUrl: asset.logoUrl }
  }

  logger.error(new Error('RWA issuer token is missing its issuerData entry'), {
    tags: { file: 'resolveRwaIssuerDisplay.ts', function: 'resolveRwaIssuerDisplay' },
    extra: { issuer: token.issuer },
  })
  return undefined
}
