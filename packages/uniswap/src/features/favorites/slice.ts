import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Ether } from '@uniswap/sdk-core'
import { WBTC } from 'uniswap/src/constants/tokens'
import { normalizeCurrencyIdForMapLookup } from 'uniswap/src/data/cache'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyId } from 'uniswap/src/types/currency'
import { currencyId as idFromCurrency } from 'uniswap/src/utils/currencyId'
import { logger } from 'utilities/src/logger/logger'

export interface FavoritesState {
  tokens: CurrencyId[]
  watchedAddresses: Address[]
}

// Default currency ids, need to be normalized to match slice add and remove behavior
const WBTC_CURRENCY_ID = normalizeCurrencyIdForMapLookup(idFromCurrency(WBTC))
const ETH_CURRENCY_ID = normalizeCurrencyIdForMapLookup(idFromCurrency(Ether.onChain(UniverseChainId.Mainnet)))

export const initialFavoritesState: FavoritesState = {
  tokens: [ETH_CURRENCY_ID, WBTC_CURRENCY_ID],
  watchedAddresses: [],
}

export const slice = createSlice({
  name: 'favorites',
  initialState: initialFavoritesState,
  reducers: {
    addFavoriteToken: (state, { payload: { currencyId } }: PayloadAction<{ currencyId: string }>) => {
      if (state.tokens.indexOf(currencyId) === -1) {
        state.tokens.push(normalizeCurrencyIdForMapLookup(currencyId)) // normalize all IDs
      } else {
        logger.warn('slice', 'addFavoriteToken', `Attempting to favorite a token twice (${currencyId})`)
      }
    },
    removeFavoriteToken: (state, { payload: { currencyId } }: PayloadAction<{ currencyId: string }>) => {
      const newTokens = state.tokens.filter((c) => {
        return c.toLocaleLowerCase() !== currencyId.toLocaleLowerCase()
      })

      if (newTokens.length === state.tokens.length) {
        logger.warn(
          'slice',
          'removeFavoriteToken',
          `Attempting to un-favorite a token that was not in favorites (${currencyId})`,
        )
      }

      state.tokens = newTokens
    },
    setFavoriteTokens: (state, { payload: { currencyIds } }: PayloadAction<{ currencyIds: string[] }>) => {
      state.tokens = currencyIds
    },
    addWatchedAddress: (state, { payload: { address } }: PayloadAction<{ address: Address }>) => {
      if (!state.watchedAddresses.includes(address)) {
        state.watchedAddresses.push(address)
      } else {
        logger.warn('slice', 'addWatchedAddress', `Attempting to watch an address twice (${address})`)
      }
    },
    removeWatchedAddress: (state, { payload: { address } }: PayloadAction<{ address: Address }>) => {
      const newWatched = state.watchedAddresses.filter((a) => a !== address)
      if (newWatched.length === state.watchedAddresses.length) {
        logger.warn(
          'slice',
          'removeWatchedAddress',
          `Attempting to remove an address not found in watched list (${address})`,
        )
      }
      state.watchedAddresses = newWatched
    },
    setFavoriteWallets: (state, { payload: { addresses } }: PayloadAction<{ addresses: Address[] }>) => {
      state.watchedAddresses = addresses
    },
  },
})

export const {
  addFavoriteToken,
  removeFavoriteToken,
  setFavoriteTokens,
  addWatchedAddress,
  removeWatchedAddress,
  setFavoriteWallets,
} = slice.actions
export const { reducer: favoritesReducer } = slice
