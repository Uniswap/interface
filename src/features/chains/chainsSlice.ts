import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'src/app/rootReducer'
import { config } from 'src/config'
import { ChainId, ChainIdTo } from 'src/constants/chains'
import { ChainState } from 'src/features/chains/types'

interface ChainsState {
  byChainId: ChainIdTo<ChainState>
}

export const initialChainsState: ChainsState = {
  byChainId: config.activeChains,
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
      state.byChainId[chainId]!.isActive = isActive
    },
    resetNetwork: () => initialChainsState,
  },
})

export const { setChainActiveStatus, resetNetwork } = slice.actions

export const chainsReducer = slice.reducer

// always rely on the state of Goerli
export const selectTestnetsAreEnabled = (state: RootState) =>
  !!state.chains.byChainId[ChainId.Goerli]?.isActive
