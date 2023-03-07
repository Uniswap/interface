import { ChainId } from '@kyberswap/ks-sdk-core'
import { createSlice } from '@reduxjs/toolkit'

export interface Dex {
  name: string
  logoURL: string
  id: string
}

interface CustomizeDexeState {
  excludeDexes: Partial<Record<ChainId, string[]>>
  allDexes: Partial<Record<ChainId, Dex[]>>
}

const slice = createSlice({
  name: 'customizeDexeState',
  initialState: { excludeDexes: {}, allDexes: {} } as CustomizeDexeState,
  reducers: {
    updateAllDexes(state, { payload: { chainId, dexes } }: { payload: { chainId: ChainId; dexes: Dex[] } }) {
      if (!state.allDexes) state.allDexes = {}
      state.allDexes[chainId] = dexes
    },
    updateExcludeDex(state, { payload: { chainId, dexes } }: { payload: { chainId: ChainId; dexes: Dex['name'][] } }) {
      if (!state.excludeDexes) state.excludeDexes = {}
      state.excludeDexes[chainId] = dexes
    },
  },
})

export const { updateAllDexes, updateExcludeDex } = slice.actions

export default slice.reducer
