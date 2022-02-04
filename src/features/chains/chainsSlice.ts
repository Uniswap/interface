import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { config } from 'src/config'
import { ChainId, ChainIdTo } from 'src/constants/chains'
import { ChainState } from 'src/features/chains/types'

interface ChainsState {
  byChainId: ChainIdTo<ChainState>
}

const initialState: ChainsState = {
  byChainId: config.activeChains,
}

const slice = createSlice({
  name: 'chains',
  initialState,
  reducers: {
    setChainActiveStatus: (
      state,
      action: PayloadAction<{ chainId: ChainId; isActive: boolean }>
    ) => {
      const { chainId, isActive } = action.payload
      state.byChainId[chainId] ??= { isActive }
      state.byChainId[chainId]!.isActive = isActive
    },
    resetNetwork: () => initialState,
  },
})

export const { setChainActiveStatus, resetNetwork } = slice.actions

export const chainsReducer = slice.reducer
