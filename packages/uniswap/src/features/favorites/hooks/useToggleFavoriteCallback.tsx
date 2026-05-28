import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { normalizeCurrencyIdForMapLookup, normalizeTokenAddressForCache } from 'uniswap/src/data/cache'
import { useMultichainFavoritesRankings } from 'uniswap/src/features/favorites/hooks/useMultichainFavoritesRankings'
import { selectFavoriteTokens } from 'uniswap/src/features/favorites/selectors'
import { addFavoriteToken, removeFavoriteToken } from 'uniswap/src/features/favorites/slice'
import { MobileEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { CurrencyId } from 'uniswap/src/types/currency'
import { currencyIdToAddress, currencyIdToChain } from 'uniswap/src/utils/currencyId'

/**
 * Find the stored favorite CurrencyId that matches the given id by address (ignoring chain).
 * Returns undefined if no match found.
 */
function findFavoriteByAddress(favorites: string[], currencyId: string): string | undefined {
  const address = currencyIdToAddress(currencyId)
  if (!address) {
    return undefined
  }
  const normalized = normalizeTokenAddressForCache(address)
  return (
    favorites.find((fav) => normalizeCurrencyIdForMapLookup(fav) === normalizeCurrencyIdForMapLookup(currencyId)) ??
    favorites.find((fav) => {
      const favAddress = currencyIdToAddress(fav)
      return favAddress ? normalizeTokenAddressForCache(favAddress) === normalized : false
    })
  )
}

/**
 * Resolve which stored favorite (if any) the user means when tapping the heart on `id`.
 *
 * Canonical match wins so cross-chain projects with DIFFERENT addresses per chain
 * (USDC / USDT / WBTC / etc.) correctly map Unichain/Arbitrum/Base/etc. → stored mainnet entry.
 * Falls back to address-only match so same-address-different-chain tokens not in rankings data
 * still work.
 */
function resolveStoredFavoriteId({
  id,
  favorites,
  canonicalByKey,
}: {
  id: CurrencyId
  favorites: string[]
  canonicalByKey: Map<string, CurrencyId>
}): string | undefined {
  const canonical = canonicalByKey.get(normalizeCurrencyIdForMapLookup(id))
  if (canonical && favorites.includes(canonical)) {
    return canonical
  }
  return findFavoriteByAddress(favorites, id)
}

export function useToggleFavoriteCallback({
  id,
  tokenName,
  isFavoriteToken,
}: {
  id: CurrencyId
  tokenName?: string
  isFavoriteToken: boolean
}): () => void {
  const dispatch = useDispatch()
  const isMultichainEnabled = useFeatureFlag(FeatureFlags.MultichainTokenUx)
  const favorites = useSelector(selectFavoriteTokens)
  const { canonicalByKey } = useMultichainFavoritesRankings()

  return useCallback(() => {
    if (isFavoriteToken) {
      if (isMultichainEnabled) {
        // Resolve via canonical map first, then address-only fallback, so USDC/USDT/WBTC on
        // non-mainnet chains (different address per chain) correctly remove the stored canonical entry.
        const storedId = resolveStoredFavoriteId({ id, favorites, canonicalByKey })
        dispatch(removeFavoriteToken({ currencyId: storedId ?? normalizeCurrencyIdForMapLookup(id) }))
      } else {
        dispatch(removeFavoriteToken({ currencyId: normalizeCurrencyIdForMapLookup(id) }))
      }
    } else {
      const normalizedId = normalizeCurrencyIdForMapLookup(id)
      // When multichain is on, prefer the canonical currencyId so the same project across chains
      // dedupes to a single favorite. Falls back to normalizedId if the token isn't in rankings yet.
      const canonicalId = isMultichainEnabled ? (canonicalByKey.get(normalizedId) ?? normalizedId) : normalizedId
      sendAnalyticsEvent(MobileEventName.FavoriteItem, {
        address: currencyIdToAddress(canonicalId),
        chain: currencyIdToChain(canonicalId) as number,
        type: 'token',
        name: tokenName,
      })
      dispatch(addFavoriteToken({ currencyId: canonicalId }))
    }
  }, [dispatch, id, isFavoriteToken, tokenName, isMultichainEnabled, favorites, canonicalByKey])
}
