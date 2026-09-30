/**
 * Primary label for a row or card that represents one issuer's token. With token categories on it is the
 * token's own BE name; the clean asset name is only the fallback for an empty proto3 default. Flag off keeps
 * the legacy asset-level name.
 */
export function getIssuerTokenPrimaryName({
  tokenName,
  fallbackName,
  plainTokenNames,
}: {
  tokenName: string
  fallbackName: string
  plainTokenNames: boolean
}): string {
  return plainTokenNames ? tokenName || fallbackName : fallbackName
}
