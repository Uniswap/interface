import type { IssuerToken } from 'uniswap/src/data/apiClients/dataApiService/rwa/types'

// Brand labels for the v1 RWA endpoints, which serve only the issuer slug. v2 ListTokenGroups serves
// `issuer.displayName`, which `getIssuerTokenLabel` prefers.
const ISSUER_DISPLAY_LABEL: Record<string, string> = {
  ondo: 'Ondo',
  backed: 'Backed',
  superstate: 'Superstate',
  xstocks: 'xStocks',
  dinari: 'Dinari',
}

export type FormatIssuerDisplaySymbolParams = {
  baseSymbol: string
  apiSymbol?: string
}

/** Uses the backend-provided issuer token symbol, falling back to the parent asset symbol when absent. */
export function formatIssuerDisplaySymbol({ baseSymbol, apiSymbol }: FormatIssuerDisplaySymbolParams): string {
  return apiSymbol ?? baseSymbol
}

export function formatIssuerLabel(issuer: string): string {
  if (!issuer) {
    return ''
  }
  return ISSUER_DISPLAY_LABEL[issuer.toLowerCase()] ?? issuer.charAt(0).toUpperCase() + issuer.slice(1)
}

/** Issuer brand label for an issuer token: the BE display name when served, else derived from the slug. */
export function getIssuerTokenLabel(issuer: Pick<IssuerToken, 'issuer' | 'issuerDisplayName'>): string {
  return issuer.issuerDisplayName || formatIssuerLabel(issuer.issuer)
}
