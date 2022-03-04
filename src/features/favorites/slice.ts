import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { CurrencyId } from 'src/utils/currencyId'
import { logger } from 'src/utils/logger'

export interface FavoritesState {
  tokens: CurrencyId[]
  // add other types of assets here, e.g. nfts
}

const initialState: FavoritesState = {
  tokens: [],
}

export const slice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    addFavoriteToken: (
      state,
      { payload: { currencyId } }: PayloadAction<{ currencyId: string }>
    ) => {
      state.tokens.indexOf(currencyId) === -1
        ? state.tokens.push(currencyId)
        : logger.warn(
            'slice',
            'addFavoriteToken',
            `Attempting to favorite a token twice (${currencyId})`
          )
    },
    removeFavoriteToken: (
      state,
      { payload: { currencyId } }: PayloadAction<{ currencyId: string }>
    ) => {
      const newTokens = state.tokens.filter((c) => c !== currencyId)

      if (newTokens.length === state.tokens.length) {
        logger.warn(
          'slice',
          'removeFavoriteToken',
          `Attempting to un-favorite a token that was not in favorites (${currencyId})`
        )
      }

      state.tokens = newTokens
    },
  },
})

export const { addFavoriteToken, removeFavoriteToken } = slice.actions
export const { reducer: favoritesReducer, actions: favoritesActions } = slice
