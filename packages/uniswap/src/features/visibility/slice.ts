import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { Visibility } from 'uniswap/src/features/favorites/slice'
import { getUniquePositionId } from 'uniswap/src/features/visibility/utils'

export type PositionKeyToVisibility = Record<string, Visibility>

export interface VisibilityState {
  positions: PositionKeyToVisibility
}

export const initialVisibilityState: VisibilityState = {
  positions: {},
}

// TODO (WEB-6138): migrate all visibility management logic in the "favorites" slice to this "visibility" slice
// Manages user-marked visibility states for positions
// Defaults to visible unless flagged as spam or explicitly marked "hidden" by the user
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
  },
})

export const { togglePositionVisibility } = slice.actions
export const { reducer: visibilityReducer } = slice
