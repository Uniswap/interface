import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ChainIdTo, ChainId } from './chains'

export interface ChainState {
  isActive: boolean
  // More properties can be added here over time
  // such as priority or hidden
}

export interface ChainsState {
  byChainId: ChainIdTo<ChainState>
}

export const initialChainsState: ChainsState = {
  byChainId: {},
}

const slice = createSlice({
  name: 'chains',
  initialState: initialChainsState,
  reducers: {
    setChainActiveStatus: (
      state,
      action: PayloadAction<{ chainId: ChainId; isActive: boolean }>
    ) => {
      const { chainId, isActive } = action.payload
      state.byChainId[chainId] ??= { isActive }
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      state.byChainId[chainId]!.isActive = isActive
    },
    resetNetwork: () => initialChainsState,
  },
})

export const { setChainActiveStatus, resetNetwork } = slice.actions

export const chainsReducer = slice.reducer

export type PartialRootState = { chains: ChainsState }
