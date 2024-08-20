import { createSelector, Selector } from '@reduxjs/toolkit'
import { unique } from 'utilities/src/primitives/array'
import { CurrencyIdToVisibility, NFTKeyToVisibility } from 'wallet/src/features/favorites/slice'
import { WalletState } from 'wallet/src/state/walletReducer'

export const selectFavoriteTokens = (state: WalletState): string[] => unique(state.favorites.tokens)

export const selectHasFavoriteTokens = createSelector(selectFavoriteTokens, (tokens) => Boolean(tokens?.length > 0))

export const makeSelectHasTokenFavorited = (): Selector<WalletState, boolean, [string]> =>
  createSelector(
    selectFavoriteTokens,
    (_: WalletState, currencyId: string) => currencyId,
    (tokens, currencyId) => tokens?.includes(currencyId.toLowerCase()),
  )

const selectWatchedAddresses = (state: WalletState): string[] => state.favorites.watchedAddresses
export const selectWatchedAddressSet = createSelector(selectWatchedAddresses, (watched) => new Set(watched))

export const selectHasWatchedWallets = createSelector(selectWatchedAddresses, (watched) => Boolean(watched?.length > 0))

export const selectNftsVisibility = (state: WalletState): NFTKeyToVisibility => state.favorites.nftsVisibility

export const selectTokensVisibility = (state: WalletState): CurrencyIdToVisibility => state.favorites.tokensVisibility
