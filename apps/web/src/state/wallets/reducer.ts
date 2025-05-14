import { createSlice } from '@reduxjs/toolkit'
import { shallowEqual } from 'react-redux'
import { type ConnectedWalletsState } from 'state/wallets/types'

const initialState: ConnectedWalletsState = {
  connectedWallets: [],
  switchingChain: false,
}

const walletsSlice = createSlice({
  name: 'wallets',
  initialState,
  reducers: {
    addConnectedWallet(state, { payload }) {
      if (state.connectedWallets.some((wallet) => shallowEqual(payload, wallet))) {
        return
      }
      state.connectedWallets = [...state.connectedWallets, payload]
    },
    startSwitchingChain(state, { payload }) {
      state.switchingChain = payload
    },
    endSwitchingChain(state) {
      state.switchingChain = false
    },
  },
})

export const { addConnectedWallet, startSwitchingChain, endSwitchingChain } = walletsSlice.actions
export default walletsSlice.reducer
