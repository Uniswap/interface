import { createSelector } from '@reduxjs/toolkit'
import { RootState } from 'src/app/rootReducer'

const selectFavoriteTokens = (state: RootState) => state.favorites.tokens

export const selectFavoriteTokensSet = createSelector(
  selectFavoriteTokens,
  (tokens) => new Set(tokens)
)
