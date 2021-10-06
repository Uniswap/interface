import { createReducer } from '@reduxjs/toolkit'

import { toggleShowDetails } from './actions'

export interface SwapState {
  showDetails: boolean
}

export const initialState: SwapState = {
  showDetails: false,
}

export default createReducer<SwapState>(initialState, (builder) =>
  builder.addCase(toggleShowDetails, (state) => ({ showDetails: !state.showDetails }))
)
