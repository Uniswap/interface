import { createListenerMiddleware, createSlice } from '@reduxjs/toolkit'
import {
  getAtomicSupportedChainIds,
  isAtomicBatchingSupported,
  isAtomicBatchingSupportedByChainId,
} from 'state/walletCapabilities/lib/handleGetCapabilities'
import type { GetCapabilitiesResult } from 'state/walletCapabilities/lib/types'
import { InterfaceUserPropertyName, setUserProperty } from 'uniswap/src/features/telemetry/user'

export enum GetCapabilitiesStatus {
  Unknown = 'Unknown',
  Supported = 'Supported',
  Unsupported = 'Unsupported',
}

export interface WalletCapabilitiesState {
  getCapabilitiesStatus: GetCapabilitiesStatus
  byChain: GetCapabilitiesResult
}

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
    if (!areCapabilitiesSupported) {
      return false
    }
    const atomicBatchingSupported = isAtomicBatchingSupportedByChainId(state.walletCapabilities.byChain, chainId)
    // if undefined, the chain is not supported
    return atomicBatchingSupported ?? false
  }
}

export const walletCapabilitiesListenerMiddleware = createListenerMiddleware()

walletCapabilitiesListenerMiddleware.startListening({
  actionCreator: setCapabilitiesByChain,
  effect: (action) => {
    const chainCapabilitiesResult = action.payload
    const atomicSupportedChainIds = getAtomicSupportedChainIds(chainCapabilitiesResult)

    if (atomicSupportedChainIds.length > 0) {
      setUserProperty(InterfaceUserPropertyName.SupportsAtomicBatching, atomicSupportedChainIds)
    }
  },
})
