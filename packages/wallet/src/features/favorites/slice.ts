import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Ether } from '@uniswap/sdk-core'
import { CurrencyId } from 'uniswap/src/types/currency'
import { logger } from 'utilities/src/logger/logger'
import { ChainId } from 'wallet/src/constants/chains'
import { WBTC } from 'wallet/src/constants/tokens'
import { currencyId as idFromCurrency } from 'wallet/src/utils/currencyId'

export type Visibility = { isVisible: boolean }
export type CurrencyIdToVisibility = Record<CurrencyId, Visibility>
export type NFTKeyToVisibility = Record<string, Visibility>

export interface FavoritesState {
  tokens: CurrencyId[]
  watchedAddresses: Address[]
  tokensVisibility: CurrencyIdToVisibility
  nftsVisibility: NFTKeyToVisibility
}

// Default currency ids, need to be in lowercase to match slice add and remove behavior
const WBTC_CURRENCY_ID = idFromCurrency(WBTC).toLowerCase()
const ETH_CURRENCY_ID = idFromCurrency(Ether.onChain(ChainId.Mainnet)).toLowerCase()

const VITALIK_ETH_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
const HAYDEN_ETH_ADDRESS = '0x50EC05ADe8280758E2077fcBC08D878D4aef79C3'
export const DEFAULT_WATCHED_ADDRESSES = [VITALIK_ETH_ADDRESS, HAYDEN_ETH_ADDRESS]

export const initialFavoritesState: FavoritesState = {
  tokens: [ETH_CURRENCY_ID, WBTC_CURRENCY_ID],
  watchedAddresses: DEFAULT_WATCHED_ADDRESSES,
  tokensVisibility: {},
  nftsVisibility: {},
}

export const slice = createSlice({
  name: 'favorites',
  initialState: initialFavoritesState,
  reducers: {
    addFavoriteToken: (
      state,
      { payload: { currencyId } }: PayloadAction<{ currencyId: string }>
    ) => {
      if (state.tokens.indexOf(currencyId) === -1) {
        state.tokens.push(currencyId.toLowerCase()) // normalize all IDs
      } else {
        logger.warn(
          'slice',
          'addFavoriteToken',
          `Attempting to favorite a token twice (${currencyId})`
        )
      }
    },
    removeFavoriteToken: (
      state,
      { payload: { currencyId } }: PayloadAction<{ currencyId: string }>
    ) => {
      const newTokens = state.tokens.filter((c) => {
        return c.toLocaleLowerCase() !== currencyId.toLocaleLowerCase()
      })

      if (newTokens.length === state.tokens.length) {
        logger.warn(
          'slice',
          'removeFavoriteToken',
          `Attempting to un-favorite a token that was not in favorites (${currencyId})`
        )
      }

      state.tokens = newTokens
    },
    setFavoriteTokens: (
      state,
      { payload: { currencyIds } }: PayloadAction<{ currencyIds: string[] }>
    ) => {
      state.tokens = currencyIds
    },
    addWatchedAddress: (state, { payload: { address } }: PayloadAction<{ address: Address }>) => {
      if (!state.watchedAddresses.includes(address)) {
        state.watchedAddresses.push(address)
      } else {
        logger.warn(
          'slice',
          'addWatchedAddress',
          `Attempting to watch an address twice (${address})`
        )
      }
    },
    removeWatchedAddress: (
      state,
      { payload: { address } }: PayloadAction<{ address: Address }>
    ) => {
      const newWatched = state.watchedAddresses.filter((a) => a !== address)
      if (newWatched.length === state.watchedAddresses.length) {
        logger.warn(
          'slice',
          'removeWatchedAddress',
          `Attempting to remove an address not found in watched list (${address})`
        )
      }
      state.watchedAddresses = newWatched
    },
    setFavoriteWallets: (
      state,
      { payload: { addresses } }: PayloadAction<{ addresses: Address[] }>
    ) => {
      state.watchedAddresses = addresses
    },
    toggleTokenVisibility: (
      state,
      { payload: { currencyId, isSpam } }: PayloadAction<{ currencyId: string; isSpam?: boolean }>
    ) => {
      const isVisible = state.tokensVisibility[currencyId]?.isVisible ?? isSpam === false
      state.tokensVisibility[currencyId] = { isVisible: !isVisible }
    },
    toggleNftVisibility: (
      state,
      { payload: { nftKey, isSpam } }: PayloadAction<{ nftKey: string; isSpam?: boolean }>
    ) => {
      const isVisible = state.nftsVisibility[nftKey]?.isVisible ?? isSpam === false
      state.nftsVisibility[nftKey] = { isVisible: !isVisible }
    },
  },
})

export const {
  addFavoriteToken,
  removeFavoriteToken,
  setFavoriteTokens,
  addWatchedAddress,
  removeWatchedAddress,
  toggleNftVisibility,
  toggleTokenVisibility,
  setFavoriteWallets,
} = slice.actions
export const { reducer: favoritesReducer } = slice
