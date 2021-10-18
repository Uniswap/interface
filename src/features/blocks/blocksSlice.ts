import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface BlockState {
  byChainId: {
    [chainId: number]: {
      latestBlockNumber: number
    }
  }
}

const initialState: BlockState = {
  byChainId: {},
}

const slice = createSlice({
  name: 'blocks',
  initialState,
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
    resetBlocks: () => initialState,
  },
})

export const { updateLatestBlocks, updateLatestBlock, resetBlocks } = slice.actions

export const blocksReducer = slice.reducer
