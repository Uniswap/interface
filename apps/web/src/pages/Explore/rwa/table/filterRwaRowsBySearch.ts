import type { Rwa } from 'uniswap/src/data/rest/rwa/types'

/** Client-side search for ranked RWA rows (symbol, name, issuer). */
export function filterRwaRowsBySearch(rows: Rwa[], filterString: string): Rwa[] {
  const query = filterString.trim().toLowerCase()
  if (!query) {
    return rows
  }

  return rows.filter((row) => {
    if (row.symbol.toLowerCase().includes(query)) {
      return true
    }
    if (row.name.toLowerCase().includes(query)) {
      return true
    }
    return row.issuerTokens.some(
      (issuer) =>
        issuer.symbol.toLowerCase().includes(query) ||
        issuer.name.toLowerCase().includes(query) ||
        issuer.issuer.toLowerCase().includes(query),
    )
  })
}
