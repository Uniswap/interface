import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectFavoriteTokens, selectHasMigratedToMultichain } from 'uniswap/src/features/favorites/selectors'
import { setFavoriteTokens, setHasMigratedToMultichain } from 'uniswap/src/features/favorites/slice'
import { CurrencyId } from 'uniswap/src/types/currency'
import { normalizeCurrencyIdForMapLookup } from 'uniswap/src/utils/currencyId'

/**
 * Given the canonical lookup and a list of favorite CurrencyIds, maps each favorite to its
 * canonical CurrencyId and dedupes. Favorites not found in the lookup are kept as-is.
 * Exported for testing.
 */
export function canonicalizeFavorites(favoriteIds: string[], canonicalByKey: Map<string, CurrencyId>): string[] {
  const seen = new Set<string>()
  const result: string[] = []

  for (const currencyId of favoriteIds) {
    const canonical = canonicalByKey.get(normalizeCurrencyIdForMapLookup(currencyId))

    const resolved = canonical ?? currencyId

    const normalizedResolved = normalizeCurrencyIdForMapLookup(resolved)
    if (!seen.has(normalizedResolved)) {
      seen.add(normalizedResolved)
      result.push(resolved)
    }
  }

  return result
}

/**
 * One-time effect that dedupes and canonicalizes favorite tokens when the multichain
 * feature flag is enabled. Runs once per user when FavoriteTokensGrid renders,
 * then sets `hasMigratedToMultichain` so it never re-runs.
 *
 * Waits for `hasData` so the migration only runs against a resolved ListTokens response —
 * running against the empty pre-fetch lookup would mark the migration done without canonicalizing.
 */
export function useCanonicalFavoritesMigration({
  canonicalByKey,
  hasData,
}: {
  canonicalByKey: Map<string, CurrencyId>
  hasData: boolean
}): void {
  const dispatch = useDispatch()
  const favoriteTokens = useSelector(selectFavoriteTokens)
  const hasMigrated = useSelector(selectHasMigratedToMultichain)

  useEffect(() => {
    if (hasMigrated || favoriteTokens.length === 0 || !hasData) {
      return
    }

    const canonicalized = canonicalizeFavorites(favoriteTokens, canonicalByKey)

    const hasChanges =
      canonicalized.length !== favoriteTokens.length || canonicalized.some((id, i) => id !== favoriteTokens[i])

    if (hasChanges) {
      dispatch(setFavoriteTokens({ currencyIds: canonicalized }))
    }

    dispatch(setHasMigratedToMultichain(true))
  }, [hasMigrated, favoriteTokens, canonicalByKey, hasData, dispatch])
}
