import { createListenerMiddleware, createSlice } from '@reduxjs/toolkit'
import { shallowEqual } from 'react-redux'
import { walletCapabilitiesListenerMiddleware } from 'state/walletCapabilities/reducer'
import { Wallet } from 'state/wallets/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { InterfaceUserPropertyName, setUserProperty } from 'uniswap/src/features/telemetry/user'

export interface ConnectedWalletsState {
  // Used to track wallets that have been connected by the user in current session, and remove them when deliberately disconnected.
  // Used to compute is_reconnect event property for analytics
  connectedWallets: Wallet[]
  switchingChain: UniverseChainId | false
  // chainId -> address
  delegatedState: Record<string, string>
}

const initialState: ConnectedWalletsState = {
  connectedWallets: [],
  switchingChain: false,
  delegatedState: {},
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
    updateDelegatedState(state, { payload }: { payload: { chainId: string; address: string } }) {
      state.delegatedState = { ...state.delegatedState, [payload.chainId]: payload.address }
    },
  },
})

export const { addConnectedWallet, startSwitchingChain, endSwitchingChain, updateDelegatedState } = walletsSlice.actions
export default walletsSlice.reducer

export const walletsListenerMiddleware = createListenerMiddleware()

// track changes to the delegated state and update the user property
walletCapabilitiesListenerMiddleware.startListening({
  actionCreator: updateDelegatedState,
  effect: (action, { getState }) => {
    const { chainId, address } = action.payload
    const state = getState() as { wallets: ConnectedWalletsState }
    const delegatedState = state.wallets.delegatedState
    const isNewDelegatedState = !delegatedState[chainId] || delegatedState[chainId] !== address
    if (isNewDelegatedState) {
      setUserProperty(InterfaceUserPropertyName.IsDelegatedEOA, Object.keys(delegatedState))
    }
  },
})
