import { createListenerMiddleware, createSlice } from '@reduxjs/toolkit'
import { shallowEqual } from 'react-redux'
import { getHandleOnSetActiveChainId, getHandleOnUpdateDelegatedState } from 'state/wallets/effects'
import { type ConnectedWalletsState } from 'state/wallets/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { InterfaceEventNameLocal } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { InterfaceUserPropertyName, setUserProperty } from 'uniswap/src/features/telemetry/user'
import { getDevLogger } from 'utilities/src/logger/logger'

const initialState: ConnectedWalletsState = {
  connectedWallets: [],
  switchingChain: false,
  delegatedState: {},
  activeChainId: undefined,
}

const walletsSlice = createSlice({
  name: 'wallets',
  initialState,
  reducers: {
    setActiveChainId(state, { payload }: { payload: { chainId?: UniverseChainId } }) {
      state.activeChainId = payload?.chainId
    },
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

export const { addConnectedWallet, startSwitchingChain, endSwitchingChain, updateDelegatedState, setActiveChainId } =
  walletsSlice.actions
export default walletsSlice.reducer

export const walletsListenerMiddleware = createListenerMiddleware<{ wallets: ConnectedWalletsState }>()

// track changes to the delegated state and update the user property
walletsListenerMiddleware.startListening({
  actionCreator: updateDelegatedState,
  effect: (action, { getOriginalState, getState }) => {
    getHandleOnUpdateDelegatedState({
      getOriginalState,
      getState,
      onDelegationDetected: handleDelegationDetected,
      onNewDelegateState: handleNewDelegateState,
      logger: getDevLogger(),
    })({ action })
  },
})

walletsListenerMiddleware.startListening({
  actionCreator: setActiveChainId,
  effect: (action, { getState }) => {
    getHandleOnSetActiveChainId({
      getState,
      onDelegationDetected: handleDelegationDetected,
      logger: getDevLogger(),
    })({ action })
  },
})

function handleNewDelegateState(input: { delegations: Record<string, string> }): void {
  getDevLogger().info(
    'reducer.ts',
    'handleNewDelegateState',
    `Updating user property for delegated EOA: ${JSON.stringify(Object.keys(input.delegations))}`,
  )
  setUserProperty(InterfaceUserPropertyName.IsDelegatedEOA, Object.keys(input.delegations))
}

function handleDelegationDetected(input: { chainId: number; address: string; isActiveChain: boolean }): void {
  getDevLogger().info(
    'reducer.ts',
    'handleDelegationDetected',
    `Sending analytics event for delegation detected: ${JSON.stringify(input)}`,
  )
  sendAnalyticsEvent(InterfaceEventNameLocal.DelegationDetected, {
    chainId: input.chainId,
    delegationAddress: input.address,
    isActiveChain: input.isActiveChain,
  })
}
