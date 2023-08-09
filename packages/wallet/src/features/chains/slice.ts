import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ACTIVE_CHAINS, ChainId, ChainIdTo, ChainState } from 'wallet/src/constants/chains'
import { RootState } from 'wallet/src/state'

export interface ChainsState {
  byChainId: ChainIdTo<ChainState>
}

export const initialChainsState: ChainsState = {
  byChainId: ACTIVE_CHAINS,
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

// always rely on the state of Goerli
export const selectTestnetsAreEnabled = (state: RootState): boolean =>
  !!state.chains.byChainId[ChainId.Goerli]?.isActive
