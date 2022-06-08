import { createSlice } from '@reduxjs/toolkit'
import { Wallet } from 'connectors'

export interface WalletState {
  // We want the user to be able to define which wallet they want to use, even if there are multiple connected wallets via web3-react.
  // If a user had previously connected a wallet but didn't have a wallet override set (because they connected prior to this field being added),
  // we want to handle that case by backfilling them manually. Once we backfill, we set the backfilled field to `true`.
  // After some period of time, our active users will have this property set so we can likely remove the backfilling logic.
  walletOverrideBackfilled: boolean
  walletOverride?: Wallet

  connectorError?: Error
}

export const initialState: WalletState = {
  walletOverride: undefined,
  walletOverrideBackfilled: false,

  connectorError: undefined,
}

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    updateWalletOverride(state, { payload: { wallet } }) {
      state.walletOverride = wallet
      state.walletOverrideBackfilled = true
    },
    updateConnectorError(state, { payload: { error } }) {
      state.connectorError = error
    },
  },
})

export const { updateWalletOverride, updateConnectorError } = walletSlice.actions
export default walletSlice.reducer
