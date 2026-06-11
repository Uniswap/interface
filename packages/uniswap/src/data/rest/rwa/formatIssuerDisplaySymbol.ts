/** Maps issuer slug → display suffix (e.g. ondo → `.o` for `TSLA.o`). */
const ISSUER_DISPLAY_SUFFIX: Record<string, string> = {
  ondo: 'o',
  backed: 'b',
  superstate: 's',
  xstocks: 'x',
  dinari: 'd',
}

const ISSUER_DISPLAY_LABEL: Record<string, string> = {
  ondo: 'Ondo',
  backed: 'Backed',
  superstate: 'Superstate',
  xstocks: 'xStocks',
  dinari: 'Dinari',
}

export type FormatIssuerDisplaySymbolParams = {
  baseSymbol: string
  issuer: string
  apiSymbol?: string
}

/**
 * Composes a human-readable issuer symbol from the API symbol (e.g. `TSLAON`) and issuer slug.
 * Falls back to the raw API symbol when the issuer is unknown.
 */
export function formatIssuerDisplaySymbol({ baseSymbol, issuer, apiSymbol }: FormatIssuerDisplaySymbolParams): string {
  const suffix = ISSUER_DISPLAY_SUFFIX[issuer.toLowerCase()]
  if (suffix) {
    return `${baseSymbol}.${suffix}`
  }
  return apiSymbol ?? baseSymbol
}

export function formatIssuerLabel(issuer: string): string {
  if (!issuer) {
    return ''
  }
  return ISSUER_DISPLAY_LABEL[issuer.toLowerCase()] ?? issuer.charAt(0).toUpperCase() + issuer.slice(1)
}
