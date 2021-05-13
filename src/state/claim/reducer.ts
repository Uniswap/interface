import { createReducer } from '@reduxjs/toolkit'
import { updateClaimWhitelist, WhitelistItem } from './actions'

export interface ClaimState {
  readonly whitelist: WhitelistItem[]
}

const initialState: ClaimState = {
  whitelist: []
}

export default createReducer<ClaimState>(initialState, builder =>
  builder.addCase(updateClaimWhitelist, (state, { payload: { whitelist } }) => ({
    ...state,
    whitelist
  }))
)
