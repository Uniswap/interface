import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Ether } from '@uniswap/sdk-core'
import { logger } from 'utilities/src/logger/logger'
import { ChainId } from 'wallet/src/constants/chains'
import { WBTC } from 'wallet/src/constants/tokens'
import { NftData } from 'wallet/src/features/nfts/types'
import { getNFTAssetKey } from 'wallet/src/features/nfts/utils'
import { removeAccount } from 'wallet/src/features/wallet/slice'
import { CurrencyId, currencyId as idFromCurrency } from 'wallet/src/utils/currencyId'

export type TokenVisibility = { isVisible: boolean }

type AccountToData<K extends string, T> = Record<Address, Record<K, T>>

export type AccountToNftData = AccountToData<ReturnType<typeof getNFTAssetKey>, NftData>

export type AccountToTokenVisibility = AccountToData<CurrencyId, TokenVisibility>

export interface FavoritesState {
  // to store if a token is favorited across all wallets
  tokens: CurrencyId[]
  // to store tokens visibility per wallet
  tokensVisibility: AccountToTokenVisibility
  watchedAddresses: Address[]
  // to store if a NFT is hidden, or its spam field should be ignored per wallet
  nftsData: AccountToNftData
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
  tokensVisibility: {},
  nftsData: {},
}

export function isNftHidden(nftData: NftData, isSpam?: boolean): boolean {
  return Boolean(nftData.isHidden || (isSpam && !nftData.isSpamIgnored))
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
    // if user has ever toggled token visibility manually, record it here
    // and use it instead of dynamic visibility filtering
    toggleTokenVisibility: (
      state,
      {
        payload: { currencyId, accountAddress, currentlyVisible },
      }: PayloadAction<{
        currencyId: string
        accountAddress: Address
        currentlyVisible: boolean
      }>
    ) => {
      state.tokensVisibility[accountAddress] ??= {}
      const accountTokensData = state.tokensVisibility[accountAddress] ?? {}
      const tokenData = accountTokensData[currencyId]
      // flip existing or create new visibility record
      if (tokenData) {
        tokenData.isVisible = !tokenData.isVisible
      } else {
        accountTokensData[currencyId] = { isVisible: !currentlyVisible }
      }
    },

    toggleNftVisibility: (
      state,
      {
        payload: { owner, contractAddress, tokenId, isSpam },
      }: PayloadAction<{
        owner: Address
        contractAddress: Address
        tokenId: string
        isSpam?: boolean
      }>
    ) => {
      const nftKey = getNFTAssetKey(contractAddress, tokenId)

      state.nftsData[owner] ??= {}
      const ownerNftsData = state.nftsData[owner] ?? {}

      ownerNftsData[nftKey] ??= {}
      const nftData = ownerNftsData[nftKey] ?? {}

      if (isNftHidden(nftData, isSpam)) {
        if (nftData.isHidden) {
          delete nftData.isHidden
        }
        if (isSpam) {
          nftData.isSpamIgnored = true
        }
      } else {
        nftData.isHidden = true
      }
      // remove nftData if it's empty
      if (Object.keys(nftData).length === 0) {
        delete ownerNftsData[nftKey]
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(removeAccount, (state, { payload: owner }) => {
      delete state.nftsData[owner]
      delete state.tokensVisibility[owner]
    })
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
