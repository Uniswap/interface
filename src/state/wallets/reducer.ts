import { createSlice } from '@reduxjs/toolkit'
import { shallowEqual } from 'react-redux'

import { Wallet } from './types'

// const currentTimestamp = () => new Date().getTime()

export interface WalletState {
  connectedWallets: Wallet[]
}

export const initialState: WalletState = {
  connectedWallets: [],
}

const walletsSlice = createSlice({
  name: 'wallets',
  initialState,
  reducers: {
    addConnectedWallet(state, { payload }) {
      state.connectedWallets = state.connectedWallets.concat(payload)
    },
    removeConnectedWallet(state, { payload }) {
      state.connectedWallets = state.connectedWallets.filter((wallet) => !shallowEqual(wallet, payload))
    },
  },
})

export const { addConnectedWallet, removeConnectedWallet } = walletsSlice.actions
export default walletsSlice.reducer
