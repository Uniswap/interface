import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getUniquePositionId } from 'uniswap/src/features/visibility/utils'
import { CurrencyId } from 'uniswap/src/types/currency'

export type Visibility = { isVisible: boolean }
export type PositionKeyToVisibility = Record<string, Visibility>
export type CurrencyIdToVisibility = Record<CurrencyId, Visibility>
export type NFTKeyToVisibility = Record<string, Visibility>

export interface VisibilityState {
  positions: PositionKeyToVisibility
  tokens: CurrencyIdToVisibility
  nfts: NFTKeyToVisibility
}

export const initialVisibilityState: VisibilityState = {
  positions: {},
  tokens: {},
  nfts: {},
}

// Manages user-marked visibility states for positions and tokens
export const slice = createSlice({
  name: 'visibility',
  initialState: initialVisibilityState,
  reducers: {
    togglePositionVisibility: (
      state,
      {
        payload: { poolId, tokenId, chainId },
      }: PayloadAction<{
        poolId: string
        tokenId: string | undefined
        chainId: UniverseChainId
      }>,
    ) => {
      const positionId = getUniquePositionId(poolId, tokenId, chainId)

      const isVisible = state.positions[positionId]?.isVisible ?? true
      state.positions[positionId] = { isVisible: !isVisible }
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
      state.nfts[nftKey] = { ...state.nfts[nftKey], isVisible }
    },
  },
})

export const { togglePositionVisibility, setTokenVisibility, setNftVisibility } = slice.actions
export const { reducer: visibilityReducer } = slice
