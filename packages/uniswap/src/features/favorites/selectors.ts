import { createSelector, Selector } from '@reduxjs/toolkit'
import { normalizeCurrencyIdForMapLookup } from 'uniswap/src/data/cache'
import { UniswapRootState } from 'uniswap/src/state'
import { unique } from 'utilities/src/primitives/array'

const selectFavoriteTokensWithPossibleDuplicates = (state: UniswapRootState): string[] => state.favorites.tokens
export const selectFavoriteTokens = createSelector(selectFavoriteTokensWithPossibleDuplicates, unique)
export const selectHasFavoriteTokens = createSelector(selectFavoriteTokens, (tokens) => Boolean(tokens.length > 0))

export const makeSelectHasTokenFavorited = (): Selector<UniswapRootState, boolean, [string]> =>
  createSelector(
    selectFavoriteTokens,
    (_: UniswapRootState, currencyId: string) => currencyId,
    (tokens, currencyId) => tokens.includes(normalizeCurrencyIdForMapLookup(currencyId)),
  )

const selectWatchedAddresses = (state: UniswapRootState): string[] => state.favorites.watchedAddresses
export const selectWatchedAddressSet = createSelector(selectWatchedAddresses, (watched) => new Set(watched))

export const selectHasWatchedWallets = createSelector(selectWatchedAddresses, (watched) => Boolean(watched.length > 0))
