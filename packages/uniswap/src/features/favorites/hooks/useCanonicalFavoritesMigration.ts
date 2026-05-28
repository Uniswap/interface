import { TokenRankingsResponse } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { normalizeCurrencyIdForMapLookup } from 'uniswap/src/data/cache'
import { buildFavoritesCanonicalLookup } from 'uniswap/src/features/favorites/canonicalFavoritesLookup'
import { selectFavoriteTokens, selectHasMigratedToMultichain } from 'uniswap/src/features/favorites/selectors'
import { setFavoriteTokens, setHasMigratedToMultichain } from 'uniswap/src/features/favorites/slice'

/**
 * Given the TokenRankings response and a list of favorite CurrencyIds, maps each favorite
 * to its canonical CurrencyId and dedupes. Favorites not found in rankings are kept as-is.
 * Exported for testing.
 */
export function canonicalizeFavorites(favoriteIds: string[], tokenRankingsData: TokenRankingsResponse): string[] {
  const { canonicalByKey } = buildFavoritesCanonicalLookup(tokenRankingsData)

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
 * Uses the TokenRankings ConnectRPC endpoint data (with multichain: true) which provides
 * `chainTokens` — cross-chain address grouping that handles different addresses across chains.
 */
export function useCanonicalFavoritesMigration({
  multichainTokenUxEnabled,
  tokenRankingsData,
}: {
  multichainTokenUxEnabled: boolean
  tokenRankingsData: TokenRankingsResponse | undefined
}): void {
  const dispatch = useDispatch()
  const favoriteTokens = useSelector(selectFavoriteTokens)
  const hasMigrated = useSelector(selectHasMigratedToMultichain)

  useEffect(() => {
    if (!multichainTokenUxEnabled || hasMigrated || favoriteTokens.length === 0 || !tokenRankingsData) {
      return
    }

    const canonicalized = canonicalizeFavorites(favoriteTokens, tokenRankingsData)

    const hasChanges =
      canonicalized.length !== favoriteTokens.length || canonicalized.some((id, i) => id !== favoriteTokens[i])

    if (hasChanges) {
      dispatch(setFavoriteTokens({ currencyIds: canonicalized }))
    }

    dispatch(setHasMigratedToMultichain(true))
  }, [multichainTokenUxEnabled, hasMigrated, favoriteTokens, tokenRankingsData, dispatch])
}
