import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { CurrencyId } from 'src/utils/currencyId'
import { logger } from 'src/utils/logger'

export interface FavoritesState {
  tokens: CurrencyId[]
  followedAddresses: Address[]
  // add other types of assets here, e.g. nfts
}

const initialState: FavoritesState = {
  tokens: [],
  followedAddresses: [],
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
    addFollow: (state, { payload: { address } }: PayloadAction<{ address: Address }>) => {
      !state.followedAddresses.includes(address)
        ? state.followedAddresses.push(address)
        : logger.warn('slice', 'addFollow', `Attempting to follow an address twice (${address})`)
    },
    removeFollow: (state, { payload: { address } }: PayloadAction<{ address: Address }>) => {
      const newFollowing = state.followedAddresses.filter((a) => a !== address)
      if (newFollowing.length === state.followedAddresses.length) {
        logger.warn(
          'slice',
          'removeFollow',
          `Attempting to un-follow an address not found in following (${address})`
        )
      }
      state.followedAddresses = newFollowing
    },
  },
})

export const { addFavoriteToken, removeFavoriteToken, addFollow, removeFollow } = slice.actions
export const { reducer: favoritesReducer, actions: favoritesActions } = slice
