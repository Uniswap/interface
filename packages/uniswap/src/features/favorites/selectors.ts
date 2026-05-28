import { createSelector, Selector } from '@reduxjs/toolkit'
import { normalizeCurrencyIdForMapLookup, normalizeTokenAddressForCache } from 'uniswap/src/data/cache'
import { UniswapRootState } from 'uniswap/src/state'
import { currencyIdToAddress } from 'uniswap/src/utils/currencyId'
import { unique } from 'utilities/src/primitives/array'

const selectFavoriteTokensWithPossibleDuplicates = (state: UniswapRootState): string[] => state.favorites.tokens
export const selectFavoriteTokens = createSelector(selectFavoriteTokensWithPossibleDuplicates, unique)
export const selectHasFavoriteTokens = createSelector(selectFavoriteTokens, (tokens) => Boolean(tokens.length > 0))

function safeGetNormalizedAddress(currencyId: string): string | undefined {
  try {
    const address = currencyIdToAddress(currencyId)
    return address ? normalizeTokenAddressForCache(address) : undefined
  } catch {
    return undefined
  }
}

/** Exact CurrencyId match (legacy). Expects a normalized CurrencyId as input. */
export const makeSelectHasTokenFavorited = (): Selector<UniswapRootState, boolean, [string]> =>
  createSelector(
    selectFavoriteTokens,
    (_: UniswapRootState, currencyId: string) => currencyId,
    (tokens, currencyId) => tokens.includes(normalizeCurrencyIdForMapLookup(currencyId)),
  )

/** Address-only match (multichain). Matches regardless of chain prefix. */
export const makeSelectHasTokenFavoritedByAddress = (): Selector<UniswapRootState, boolean, [string]> =>
  createSelector(
    selectFavoriteTokens,
    (_: UniswapRootState, currencyId: string) => currencyId,
    (tokens, currencyId) => {
      const address = safeGetNormalizedAddress(currencyId)
      if (!address) {
        return false
      }
      return (
        tokens.includes(normalizeCurrencyIdForMapLookup(currencyId)) ||
        tokens.some((fav) => safeGetNormalizedAddress(fav) === address)
      )
    },
  )

const selectWatchedAddresses = (state: UniswapRootState): string[] => state.favorites.watchedAddresses
export const selectWatchedAddressSet = createSelector(selectWatchedAddresses, (watched) => new Set(watched))

export const selectHasWatchedWallets = createSelector(selectWatchedAddresses, (watched) => Boolean(watched.length > 0))

export const selectHasMigratedToMultichain = (state: UniswapRootState): boolean =>
  state.favorites.hasMigratedToMultichain ?? false
