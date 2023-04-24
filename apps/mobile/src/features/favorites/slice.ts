import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Ether } from '@uniswap/sdk-core'
import { ChainId } from 'src/constants/chains'
import { WBTC } from 'src/constants/tokens'
import { getNFTAssetKey } from 'src/features/nfts/utils'
import { removeAccount } from 'src/features/wallet/walletSlice'
import { CurrencyId, currencyId as idFromCurrency } from 'src/utils/currencyId'
import { logger } from 'src/utils/logger'

export type HiddenNftsByAddress = Record<Address, Record<ReturnType<typeof getNFTAssetKey>, true>>

export interface FavoritesState {
  tokens: CurrencyId[]
  watchedAddresses: Address[]
  hiddenNfts: HiddenNftsByAddress
  // add other types of assets here, e.g. nfts
}

// Default currency ids, need to be in lowercase to match slice add and remove behavior
const WBTC_CURRENCY_ID = idFromCurrency(WBTC).toLowerCase()
const ETH_CURRENCY_ID = idFromCurrency(Ether.onChain(ChainId.Mainnet)).toLowerCase()

const VITALIK_ETH_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
const HAYDEN_ETH_ADDRESS = '0x50EC05ADe8280758E2077fcBC08D878D4aef79C3'

export const initialFavoritesState: FavoritesState = {
  tokens: [ETH_CURRENCY_ID, WBTC_CURRENCY_ID],
  watchedAddresses: [VITALIK_ETH_ADDRESS, HAYDEN_ETH_ADDRESS],
  hiddenNfts: {},
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
    toggleNftVisibility: (
      state,
      {
        payload: { owner, contractAddress, tokenId },
      }: PayloadAction<{ owner: Address; contractAddress: Address; tokenId: string }>
    ) => {
      const key = getNFTAssetKey(contractAddress, tokenId)
      if (state.hiddenNfts[owner]?.[key]) {
        delete state.hiddenNfts[owner]?.[key]
      } else {
        if (!state.hiddenNfts[owner]) {
          state.hiddenNfts[owner] = {}
        }
        const ownerData = state.hiddenNfts[owner]
        if (ownerData !== undefined) {
          ownerData[key] = true
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(removeAccount, (state, { payload: owner }) => {
      delete state.hiddenNfts[owner]
    })
  },
})

export const {
  addFavoriteToken,
  removeFavoriteToken,
  addWatchedAddress,
  removeWatchedAddress,
  toggleNftVisibility,
} = slice.actions
export const { reducer: favoritesReducer } = slice
