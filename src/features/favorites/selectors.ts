import { createSelector } from '@reduxjs/toolkit'
import { RootState } from 'src/app/rootReducer'

const selectFavoriteTokens = (state: RootState): string[] => state.favorites.tokens

export const selectFavoriteTokensSet = createSelector(
  selectFavoriteTokens,
  (tokens) => new Set(tokens)
)
export const selectHasFavoriteTokens = createSelector(selectFavoriteTokens, (tokens) =>
  Boolean(tokens?.length > 0)
)

// Used to reference specific token without depending on entire array
export const selectHasFavoriteToken = createSelector(
  [selectFavoriteTokens, (_, address): string => address],
  (tokens, address) => tokens?.includes(address.toLowerCase())
)

const selectWatchedAddresses = (state: RootState): string[] => state.favorites.watchedAddresses
export const selectWatchedAddressSet = createSelector(
  selectWatchedAddresses,
  (watched) => new Set(watched)
)

export const selectHasWatchedWallets = createSelector(selectWatchedAddresses, (watched) =>
  Boolean(watched?.length > 0)
)
