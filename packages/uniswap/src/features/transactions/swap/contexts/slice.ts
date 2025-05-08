import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyField } from 'uniswap/src/types/currency'

export interface SwapSettingsState {
  filteredChainIds: { [key in CurrencyField]?: UniverseChainId } | undefined
}

export const initialSwapSettingsState: SwapSettingsState = {
  filteredChainIds: undefined,
}

export const slice = createSlice({
  name: 'swapSettings',
  initialState: initialSwapSettingsState,
  reducers: {
    updateFilteredChainIds: (
      state,
      {
        payload: { filteredChainIds },
      }: PayloadAction<{ filteredChainIds: { [key in CurrencyField]?: UniverseChainId } }>,
    ) => {
      state.filteredChainIds = { ...filteredChainIds }
    },
    resetFilteredChainIds: (state) => {
      state.filteredChainIds = undefined
    },
  },
})

export const { updateFilteredChainIds, resetFilteredChainIds } = slice.actions
export const { reducer: swapSettingsReducer } = slice
