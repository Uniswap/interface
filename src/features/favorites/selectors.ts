import { createSelector } from '@reduxjs/toolkit'
import { RootState } from 'src/app/rootReducer'

const selectFavoriteTokens = (state: RootState) => state.favorites.tokens

export const selectFavoriteTokensSet = createSelector(
  selectFavoriteTokens,
  (tokens) => new Set(tokens)
)

const selectFollowedAddresses = (state: RootState) => state.favorites.followedAddresses
export const selectFollowedAddressSet = createSelector(
  selectFollowedAddresses,
  (following) => new Set(following)
)
