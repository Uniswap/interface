import { createSlice } from '@reduxjs/toolkit'
import { shallowEqual } from 'react-redux'

import { Wallet } from './types'

/* Used to track wallets that have been connected by the user in current session, and remove them when deliberately disconnected. 
  Used to compute is_reconnect event property for analytics */
export interface WalletState {
  connectedWallets: Set<Wallet>
}

export const initialState: WalletState = {
  connectedWallets: new Set(),
}

const walletsSlice = createSlice({
  name: 'wallets',
  initialState,
  reducers: {
    addConnectedWallet(state, { payload }) {
      state.connectedWallets.forEach((wallet) => {
        if (!shallowEqual(wallet, payload)) {
          state.connectedWallets.add(payload)
        }
      })
    },
    removeConnectedWallet(state, { payload }) {
      state.connectedWallets.forEach((wallet) => {
        if (shallowEqual(wallet, payload)) {
          state.connectedWallets.delete(wallet)
        }
      })
    },
  },
})

export const { addConnectedWallet, removeConnectedWallet } = walletsSlice.actions
export default walletsSlice.reducer
