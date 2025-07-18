import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { CurrencyField } from 'uniswap/src/types/currency'

export interface SwapSettingsState {
  filteredChainIds: { [key in CurrencyField]?: UniverseChainId } | undefined
}

const initialSwapSettingsState: SwapSettingsState = {
  filteredChainIds: undefined,
}

const slice = createSlice({
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

export const { updateFilteredChainIds } = slice.actions
export const { reducer: swapSettingsReducer } = slice
