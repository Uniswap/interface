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
