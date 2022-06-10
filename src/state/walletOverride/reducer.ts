import { createSlice } from '@reduxjs/toolkit'
import { Wallet } from 'connectors'

export interface WalletOverrideState {
  // We want the user to be able to define which wallet they want to use, even if there are multiple connected wallets via web3-react.
  // If a user had previously connected a wallet but didn't have a wallet override set (because they connected prior to this field being added),
  // we want to handle that case by backfilling them manually. Once we backfill, we set the backfilled field to `true`.
  // After some period of time, our active users will have this property set so we can likely remove the backfilling logic.
  walletOverrideBackfilled: boolean
  walletOverride?: Wallet
}

export const initialState: WalletOverrideState = {
  walletOverride: undefined,
  walletOverrideBackfilled: false,
}

const walletOverrideSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    updateWalletOverride(state, { payload: { wallet } }) {
      state.walletOverride = wallet
      state.walletOverrideBackfilled = true
    },
  },
})

export const { updateWalletOverride } = walletOverrideSlice.actions
export default walletOverrideSlice.reducer
