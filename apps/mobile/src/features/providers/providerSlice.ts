import { createSlice } from '@reduxjs/toolkit'

interface ProviderState {
  isInitialized: boolean
}

export const initialProvidersState: ProviderState = {
  isInitialized: false,
}

const slice = createSlice({
  name: 'providers',
  initialState: initialProvidersState,
  reducers: {
    initialized: (state) => {
      state.isInitialized = true
    },
  },
})

export const { initialized } = slice.actions

export const providersReducer = slice.reducer
