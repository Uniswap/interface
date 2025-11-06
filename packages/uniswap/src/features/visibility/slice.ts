import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getUniquePositionId } from 'uniswap/src/features/visibility/utils'
import { CurrencyId } from 'uniswap/src/types/currency'

export type Visibility = { isVisible: boolean }
export type PositionKeyToVisibility = Record<string, Visibility>
export type CurrencyIdToVisibility = Record<CurrencyId, Visibility>
export type NFTKeyToVisibility = Record<string, Visibility>
export type ActivityIdToVisibility = Record<string, Visibility>

export interface VisibilityState {
  positions: PositionKeyToVisibility
  tokens: CurrencyIdToVisibility
  nfts: NFTKeyToVisibility
  activity: ActivityIdToVisibility
}

export const initialVisibilityState: VisibilityState = {
  positions: {},
  tokens: {},
  nfts: {},
  activity: {},
}

// Manages user-marked visibility states for positions and tokens
export const slice = createSlice({
  name: 'visibility',
  initialState: initialVisibilityState,
  reducers: {
    setPositionVisibility: (
      state,
      {
        payload: { poolId, tokenId, chainId, isVisible },
      }: PayloadAction<{
        poolId: string
        tokenId: string | undefined
        chainId: UniverseChainId
        isVisible: boolean
      }>,
    ) => {
      const positionId = getUniquePositionId({ poolId, tokenId, chainId })
      state.positions[positionId] = { isVisible }
    },
    setTokenVisibility: (
      state,
      { payload: { currencyId, isVisible } }: PayloadAction<{ currencyId: string; isVisible: boolean }>,
    ) => {
      state.tokens[currencyId] = { ...state.tokens[currencyId], isVisible }
    },
    setNftVisibility: (
      state,
      { payload: { nftKey, isVisible } }: PayloadAction<{ nftKey: string; isVisible: boolean }>,
    ) => {
      state.nfts[nftKey] = { isVisible }
    },
    setActivityVisibility: (
      state,
      { payload: { transactionId, isVisible } }: PayloadAction<{ transactionId: string; isVisible: boolean }>,
    ) => {
      state.activity[transactionId] = { isVisible }
    },
  },
})

export const { setPositionVisibility, setTokenVisibility, setNftVisibility, setActivityVisibility } = slice.actions
export const { reducer: visibilityReducer } = slice
