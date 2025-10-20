import { createListenerMiddleware, createSlice } from '@reduxjs/toolkit'
import { createOnSetCapabilitiesByChainEffect } from 'state/walletCapabilities/effects'
import {
  isAtomicBatchingSupported,
  isAtomicBatchingSupportedByChainId,
} from 'state/walletCapabilities/lib/handleGetCapabilities'
import type { GetCapabilitiesResult } from 'state/walletCapabilities/lib/types'
import { GetCapabilitiesStatus, WalletCapabilitiesState } from 'state/walletCapabilities/types'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send.web'
import { InterfaceUserPropertyName, setUserProperty } from 'uniswap/src/features/telemetry/user'
import { hexToNumber } from 'utilities/src/addresses/hex'

const initialState: WalletCapabilitiesState = {
  getCapabilitiesStatus: GetCapabilitiesStatus.Unknown,
  byChain: {},
}

const walletCapabilitiesSlice = createSlice({
  name: 'walletCapabilities',
  initialState,
  reducers: {
    setCapabilitiesNotSupported(state) {
      state.getCapabilitiesStatus = GetCapabilitiesStatus.Unsupported
    },
    setCapabilitiesByChain(state, { payload }: { payload: GetCapabilitiesResult }) {
      state.byChain = payload
      state.getCapabilitiesStatus = GetCapabilitiesStatus.Supported
    },
    handleResetWalletCapabilitiesState(state) {
      state.getCapabilitiesStatus = GetCapabilitiesStatus.Unknown
      state.byChain = {}
    },
  },
})

export const { setCapabilitiesByChain, handleResetWalletCapabilitiesState, setCapabilitiesNotSupported } =
  walletCapabilitiesSlice.actions

export default walletCapabilitiesSlice.reducer

export const selectNeedsToCheckCapabilities = (state: { walletCapabilities: WalletCapabilitiesState }): boolean => {
  return state.walletCapabilities.getCapabilitiesStatus === GetCapabilitiesStatus.Unknown
}

const selectWalletCapabilitiesSupported = (state: { walletCapabilities: WalletCapabilitiesState }): boolean => {
  return state.walletCapabilities.getCapabilitiesStatus === GetCapabilitiesStatus.Supported
}

export const selectIsAtomicBatchingSupported = (state: { walletCapabilities: WalletCapabilitiesState }): boolean => {
  const values = Object.values(state.walletCapabilities.byChain)
  return values.some(isAtomicBatchingSupported)
}

export const selectIsAtomicBatchingSupportedByChainId = (state: {
  walletCapabilities: WalletCapabilitiesState
}): ((chainId: number) => boolean | undefined) => {
  return (chainId: number) => {
    if (selectNeedsToCheckCapabilities(state)) {
      return undefined
    }
    const areCapabilitiesSupported = selectWalletCapabilitiesSupported(state)
    return areCapabilitiesSupported && isAtomicBatchingSupportedByChainId(state.walletCapabilities.byChain, chainId)
  }
}

export const walletCapabilitiesListenerMiddleware = createListenerMiddleware<{
  walletCapabilities: WalletCapabilitiesState
}>()

walletCapabilitiesListenerMiddleware.startListening({
  actionCreator: setCapabilitiesByChain,
  effect: (action, { getOriginalState }) => {
    createOnSetCapabilitiesByChainEffect({
      getOriginalState,
      onAtomicSupportedChainIdsDetected,
      onWalletCapabilitiesDetected,
    })(action)
  },
})

function onAtomicSupportedChainIdsDetected(chainIds: number[]) {
  setUserProperty(InterfaceUserPropertyName.SupportsAtomicBatching, chainIds)
}

function onWalletCapabilitiesDetected(chainCapabilitiesResult: GetCapabilitiesResult) {
  for (const [chainId, capabilities] of Object.entries(chainCapabilitiesResult)) {
    sendAnalyticsEvent(InterfaceEventName.WalletCapabilitiesDetected, {
      chainId: hexToNumber(chainId),
      capabilities,
    })
  }
}
