import { useMemo } from 'react'
import { FORCountry } from 'uniswap/src/features/fiatOnRamp/types'
import { useCurrentLocale } from 'uniswap/src/features/language/hooks'
import { bubbleToTop } from 'utilities/src/primitives/array'

/**
 * Builds a comparator that orders countries alphabetically by localized display name.
 *
 * The FOR API returns countries in an unspecified order — newly supported regions are appended
 * rather than slotted in — so callers must sort rather than trust the response order. `countryCode`
 * breaks ties so the result never depends on that order.
 *
 * Collator, not `sort()`/`localeCompare`: the default order is by code unit, so accented names
 * (Åland, Côte d'Ivoire, Türkiye) would sort after Z. `base` sensitivity folds case and accents.
 */
export function createCountryComparator(locale: string): (a: FORCountry, b: FORCountry) => number {
  const collator = new Intl.Collator(locale, { sensitivity: 'base' })
  return (a, b) => collator.compare(a.displayName, b.displayName) || a.countryCode.localeCompare(b.countryCode)
}

/**
 * Case- and accent-insensitive, matching the collator's `sensitivity: 'base'` ordering above — so a
 * country that sorts under a plain letter can also be found by typing one ("al" finds Åland Islands).
 */
function normalizeForSearch(value: string): string {
  return (
    value
      // Split each accented letter into its base letter plus a combining mark (Å → A + ring above)
      .normalize('NFD')
      // Drop the marks, leaving the base letter. Letters with no such decomposition (ø, ł) are kept.
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
  )
}

/**
 * Orders countries for a region picker: alphabetical by localized display name, the selected
 * country pinned to the top, then narrowed to `searchText`.
 *
 * Callers own any debouncing of `searchText`.
 */
export function useFilteredCountryData({
  countries,
  searchText,
  selectedCountryCode,
}: {
  countries: FORCountry[] | undefined
  searchText: string
  selectedCountryCode: string | undefined
}): FORCountry[] {
  const locale = useCurrentLocale()
  const compareCountries = useMemo(() => createCountryComparator(locale), [locale])

  // Kept off the typing path: callers may pass `searchText` undebounced, and running ~250 countries
  // through `Intl.Collator` on every keystroke is the expensive half of this hook.
  const sorted = useMemo(() => {
    if (!countries) {
      return []
    }
    return bubbleToTop([...countries].sort(compareCountries), (c) => c.countryCode === selectedCountryCode)
  }, [countries, compareCountries, selectedCountryCode])

  return useMemo(() => {
    const query = normalizeForSearch(searchText.trim())
    return query ? sorted.filter((c) => normalizeForSearch(c.displayName).startsWith(query)) : sorted
  }, [sorted, searchText])
}
