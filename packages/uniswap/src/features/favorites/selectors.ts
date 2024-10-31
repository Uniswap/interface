import { createSelector, Selector } from '@reduxjs/toolkit'
import { CurrencyIdToVisibility, NFTKeyToVisibility } from 'uniswap/src/features/favorites/slice'
import { UniswapRootState } from 'uniswap/src/state'
import { unique } from 'utilities/src/primitives/array'

const selectFavoriteTokensWithPossibleDuplicates = (state: UniswapRootState): string[] => state.favorites.tokens
export const selectFavoriteTokens = createSelector(selectFavoriteTokensWithPossibleDuplicates, unique)
export const selectHasFavoriteTokens = createSelector(selectFavoriteTokens, (tokens) => Boolean(tokens?.length > 0))

export const makeSelectHasTokenFavorited = (): Selector<UniswapRootState, boolean, [string]> =>
  createSelector(
    selectFavoriteTokens,
    (_: UniswapRootState, currencyId: string) => currencyId,
    (tokens, currencyId) => tokens?.includes(currencyId.toLowerCase()),
  )

const selectWatchedAddresses = (state: UniswapRootState): string[] => state.favorites.watchedAddresses
export const selectWatchedAddressSet = createSelector(selectWatchedAddresses, (watched) => new Set(watched))

export const selectHasWatchedWallets = createSelector(selectWatchedAddresses, (watched) => Boolean(watched?.length > 0))

export const selectNftsVisibility = (state: UniswapRootState): NFTKeyToVisibility => state.favorites.nftsVisibility

export const selectTokensVisibility = (state: UniswapRootState): CurrencyIdToVisibility =>
  state.favorites.tokensVisibility
