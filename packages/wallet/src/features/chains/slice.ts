import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ChainId, ChainIdTo } from './chains'

export interface ChainState {
  isActive: boolean
  // More properties can be added here over time
  // such as priority or hidden
}

export interface ChainsState {
  currentChainId: ChainId
  byChainId: ChainIdTo<ChainState>
}

export const initialChainsState: ChainsState = {
  currentChainId: ChainId.Mainnet,
  byChainId: {},
}

const slice = createSlice({
  name: 'chains',
  initialState: initialChainsState,
  reducers: {
    setCurrentChain: (state, action: PayloadAction<{ chainId: ChainId }>) => {
      const { chainId } = action.payload
      state.currentChainId = chainId
    },

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

export const { setCurrentChain, setChainActiveStatus, resetNetwork } =
  slice.actions

export const chainsReducer = slice.reducer

export type PartialRootState = { chains: ChainsState }
