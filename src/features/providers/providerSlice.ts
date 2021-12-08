import { createSlice } from '@reduxjs/toolkit'

interface ProviderState {
  isInitialized: boolean
}

const initialState: ProviderState = {
  isInitialized: false,
}

const slice = createSlice({
  name: 'providers',
  initialState,
  reducers: {
    initialized: (state) => {
      state.isInitialized = true
    },
  },
})

export const { initialized } = slice.actions

export const providersReducer = slice.reducer
