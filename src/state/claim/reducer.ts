import { createReducer } from '@reduxjs/toolkit'
import { updateClaimWhitelist, updateClaimTxConfirmed, WhitelistItem } from './actions'

export interface ClaimState {
  readonly whitelist: WhitelistItem[]
  readonly claimTxConfirmed: boolean
}

const initialState: ClaimState = {
  whitelist: [],
  claimTxConfirmed: false
}

export default createReducer<ClaimState>(initialState, builder =>
  builder
    .addCase(updateClaimWhitelist, (state, { payload: { whitelist } }) => ({
      ...state,
      whitelist
    }))
    .addCase(updateClaimTxConfirmed, (state, { payload }) => ({
      ...state,
      claimTxConfirmed: payload
    }))
)
