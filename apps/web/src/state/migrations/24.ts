import { PersistState } from 'redux-persist'
import { GetCapabilitiesStatus, WalletCapabilitiesState } from 'state/walletCapabilities/types'

type PersistAppStateV24 = {
  _persist: PersistState
  walletCapabilities?: unknown
}

// Helper function to validate the shape of walletCapabilities
const isValidWalletCapabilities = (walletCapabilities: unknown): walletCapabilities is WalletCapabilitiesState => {
  return (
    !!walletCapabilities &&
    typeof walletCapabilities === 'object' &&
    'byChain' in walletCapabilities &&
    typeof (walletCapabilities as WalletCapabilitiesState).byChain === 'object' &&
    'getCapabilitiesStatus' in walletCapabilities &&
    typeof (walletCapabilities as WalletCapabilitiesState).getCapabilitiesStatus === 'string'
  )
}

/**
 * Migration 24: Ensure walletCapabilities is correct shape
 */
export const migration24 = (state: PersistAppStateV24 | undefined) => {
  if (!state) {
    return undefined
  }

  // Reset to initial state if walletCapabilities is missing or has invalid shape
  if (!isValidWalletCapabilities(state.walletCapabilities)) {
    return {
      ...state,
      walletCapabilities: {
        getCapabilitiesStatus: GetCapabilitiesStatus.Unknown,
        byChain: {},
      },
      _persist: {
        ...state._persist,
        version: 24,
      },
    }
  }

  // Structure is valid, return the state unchanged but update version
  return {
    ...state,
    _persist: {
      ...state._persist,
      version: 24,
    },
  }
}
