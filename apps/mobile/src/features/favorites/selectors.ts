import { createSelector } from '@reduxjs/toolkit'
import { MobileState } from 'src/app/reducer'
import { AccountToNftData, AccountToTokenVisibility } from 'src/features/favorites/slice'

const selectFavoriteTokens = (state: MobileState): string[] => state.favorites.tokens

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

const selectWatchedAddresses = (state: MobileState): string[] => state.favorites.watchedAddresses
export const selectWatchedAddressSet = createSelector(
  selectWatchedAddresses,
  (watched) => new Set(watched)
)

export const selectHasWatchedWallets = createSelector(selectWatchedAddresses, (watched) =>
  Boolean(watched?.length > 0)
)

export const selectNftsData = (state: MobileState): AccountToNftData => state.favorites.nftsData
export const selectTokensVisibility = (state: MobileState): AccountToTokenVisibility =>
  state.favorites.tokensVisibility
