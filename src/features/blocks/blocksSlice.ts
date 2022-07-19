import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface BlockState {
  byChainId: {
    [chainId: number]: {
      latestBlockNumber: number
    }
  }
}

export const initialBlockState: BlockState = {
  byChainId: {},
}

const slice = createSlice({
  name: 'blocks',
  initialState: initialBlockState,
  reducers: {
    updateLatestBlocks: (state, action: PayloadAction<BlockState['byChainId']>) => {
      state.byChainId = {
        ...state.byChainId,
        ...action.payload,
      }
    },
    updateLatestBlock: (
      state,
      action: PayloadAction<{ chainId: number; latestBlockNumber: number }>
    ) => {
      const { chainId, latestBlockNumber } = action.payload
      state.byChainId[chainId] = {
        latestBlockNumber,
      }
    },
    resetBlocks: () => initialBlockState,
  },
})

export const { updateLatestBlocks, updateLatestBlock, resetBlocks } = slice.actions

export const blocksReducer = slice.reducer
