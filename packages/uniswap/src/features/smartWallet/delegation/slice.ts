import { createListenerMiddleware, createSlice, PayloadAction } from '@reduxjs/toolkit'
import {
  getHandleOnSetActiveChainId,
  getHandleOnUpdateDelegatedState,
} from 'uniswap/src/features/smartWallet/delegation/effects'
import type { DelegatedState } from 'uniswap/src/features/smartWallet/delegation/types'
import { UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { setUserProperty, UniswapUserPropertyName } from 'uniswap/src/features/telemetry/user'
import { getDevLogger } from 'utilities/src/logger/logger'

const initialState: DelegatedState = {
  delegations: {},
  activeChainId: undefined,
}

export const delegationSlice = createSlice({
  name: 'delegation',
  initialState,
  reducers: {
    updateDelegatedState(state, { payload }: PayloadAction<{ chainId: string; address: string }>) {
      state.delegations = { ...state.delegations, [payload.chainId]: payload.address }
    },
    setActiveChainId(state, { payload }: PayloadAction<{ chainId?: number }>) {
      state.activeChainId = payload.chainId
    },
  },
})

export const { updateDelegatedState, setActiveChainId } = delegationSlice.actions
export const delegationReducer = delegationSlice.reducer

// Create a listener middleware for delegation events
export const delegationListenerMiddleware = createListenerMiddleware<{ delegation: DelegatedState }>()

// Track changes to the delegated state and update the user property
delegationListenerMiddleware.startListening({
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

// Listen for active chain changes to check for delegations on that chain
delegationListenerMiddleware.startListening({
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
    'slice.ts',
    'handleNewDelegateState',
    `Updating user property for delegated EOA: ${JSON.stringify(Object.keys(input.delegations))}`,
  )

  setUserProperty(UniswapUserPropertyName.IsDelegatedEOA, Object.keys(input.delegations))
}

function handleDelegationDetected(input: { chainId: number; address: string; isActiveChain: boolean }): void {
  getDevLogger().info(
    'slice.ts',
    'handleDelegationDetected',
    `Sending analytics event for delegation detected: ${JSON.stringify(input)}`,
  )

  sendAnalyticsEvent(UniswapEventName.DelegationDetected, {
    chainId: input.chainId,
    delegationAddress: input.address,
    isActiveChain: input.isActiveChain,
  })
}
