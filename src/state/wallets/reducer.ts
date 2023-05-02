import { createSlice } from '@reduxjs/toolkit'
import { shallowEqual } from 'react-redux'

import { Wallet } from './types'

// Used to track wallets that have been connected by the user in current session, and remove them when deliberately disconnected.
// Used to compute is_reconnect event property for analytics
interface WalletState {
  connectedWallets: Wallet[]
}

const initialState: WalletState = {
  connectedWallets: [],
}

const walletsSlice = createSlice({
  name: 'wallets',
  initialState,
  reducers: {
    addConnectedWallet(state, { payload }) {
      if (state.connectedWallets.some((wallet) => shallowEqual(payload, wallet))) return
      state.connectedWallets = [...state.connectedWallets, payload]
    },
  },
})

export const { addConnectedWallet } = walletsSlice.actions
export default walletsSlice.reducer
