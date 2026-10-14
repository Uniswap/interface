import {
  createCountryComparator,
  useFilteredCountryData,
} from 'uniswap/src/features/fiatOnRamp/hooks/useFilteredCountryData'
import { FORCountry } from 'uniswap/src/features/fiatOnRamp/types'
import { renderHook } from 'uniswap/src/test/test-utils'

function country(countryCode: string, displayName: string): FORCountry {
  return { countryCode, displayName }
}

const JAPAN = country('JP', 'Japan')
const ARGENTINA = country('AR', 'Argentina')
const BRAZIL = country('BR', 'Brazil')
const COUNTRIES = [JAPAN, ARGENTINA, BRAZIL]

function sortedCodes(countries: FORCountry[], locale = 'en-US'): string[] {
  return [...countries].sort(createCountryComparator(locale)).map((c) => c.countryCode)
}

describe('createCountryComparator', () => {
  test('sorts by display name regardless of the order the API returned', () => {
    expect(sortedCodes(COUNTRIES)).toEqual(['AR', 'BR', 'JP'])
    expect(sortedCodes([...COUNTRIES].reverse())).toEqual(['AR', 'BR', 'JP'])
  })

  test('keeps accented names next to their unaccented spelling instead of after Z', () => {
    expect(sortedCodes([country('ZM', 'Zambia'), country('AX', 'Åland Islands'), country('AL', 'Albania')])).toEqual([
      'AX',
      'AL',
      'ZM',
    ])
  })

  test('breaks display name ties on country code', () => {
    const tied = [country('VI', 'Virgin Islands'), country('VG', 'Virgin Islands')]
    expect(sortedCodes(tied)).toEqual(['VG', 'VI'])
    expect(sortedCodes([...tied].reverse())).toEqual(['VG', 'VI'])
  })
})

describe('useFilteredCountryData', () => {
  function renderFiltered(props: Partial<Parameters<typeof useFilteredCountryData>[0]> = {}): {
    current: FORCountry[]
  } {
    const { result } = renderHook(() =>
      useFilteredCountryData({
        countries: COUNTRIES,
        searchText: '',
        selectedCountryCode: undefined,
        ...props,
      }),
    )
    return result
  }

  test('returns an empty list while the country list is undefined', () => {
    expect(renderFiltered({ countries: undefined }).current).toEqual([])
  })

  test('sorts alphabetically', () => {
    expect(renderFiltered().current.map((c) => c.countryCode)).toEqual(['AR', 'BR', 'JP'])
  })

  test('pins the selected country above the alphabetical remainder', () => {
    expect(renderFiltered({ selectedCountryCode: 'JP' }).current.map((c) => c.countryCode)).toEqual(['JP', 'AR', 'BR'])
  })

  test('filters to display names starting with the search text, case-insensitively', () => {
    expect(renderFiltered({ searchText: 'bra' }).current.map((c) => c.countryCode)).toEqual(['BR'])
    expect(renderFiltered({ searchText: 'BRA' }).current.map((c) => c.countryCode)).toEqual(['BR'])
    expect(renderFiltered({ searchText: 'razil' }).current).toEqual([])
  })

  test('finds accented names from their unaccented spelling, matching how they sort', () => {
    const accented = [country('AX', 'Åland Islands'), country('RE', 'Réunion'), country('BR', 'Brazil')]
    expect(renderFiltered({ countries: accented, searchText: 'al' }).current.map((c) => c.countryCode)).toEqual(['AX'])
    expect(renderFiltered({ countries: accented, searchText: 're' }).current.map((c) => c.countryCode)).toEqual(['RE'])
    // Typing the accented character still works.
    expect(renderFiltered({ countries: accented, searchText: 'Åla' }).current.map((c) => c.countryCode)).toEqual(['AX'])
  })

  test('ignores surrounding whitespace, which autocorrect appends when it accepts a word', () => {
    expect(renderFiltered({ searchText: 'brazil ' }).current.map((c) => c.countryCode)).toEqual(['BR'])
    expect(renderFiltered({ searchText: '   ' }).current.map((c) => c.countryCode)).toEqual(['AR', 'BR', 'JP'])
  })

  test('keeps the selected country pinned while searching', () => {
    const result = renderFiltered({ searchText: 'a', selectedCountryCode: 'AR' })
    expect(result.current.map((c) => c.countryCode)).toEqual(['AR'])
  })

  // Callers pass the list straight from the query cache, so a stable `countries` reference should
  // not produce a new array on every render — a new `data` array makes the list reassign containers.
  test('returns a stable reference when nothing changes', () => {
    const { result, rerender } = renderHook(() =>
      useFilteredCountryData({
        countries: COUNTRIES,
        searchText: '',
        selectedCountryCode: undefined,
      }),
    )
    const first = result.current
    rerender()
    expect(result.current).toBe(first)
  })
})
