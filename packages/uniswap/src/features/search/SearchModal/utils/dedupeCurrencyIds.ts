import { normalizeCurrencyIdForMapLookup } from 'uniswap/src/data/cache'

/**
 * Dedupe currencyIds by their normalized map-lookup key, preserving first-seen order
 * and returning the original (un-normalized) id string for each survivor.
 */
export function dedupeCurrencyIds(ids: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const id of ids) {
    const key = normalizeCurrencyIdForMapLookup(id)
    if (!seen.has(key)) {
      seen.add(key)
      out.push(id)
    }
  }
  return out
}
