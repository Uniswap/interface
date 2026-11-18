/**
 * Primary label for a row or card that represents one issuer's token: the token's own BE name, with the
 * clean asset name as the fallback for an empty proto3 default.
 */
export function getIssuerTokenPrimaryName({
  tokenName,
  fallbackName,
}: {
  tokenName: string
  fallbackName: string
}): string {
  return tokenName || fallbackName
}
