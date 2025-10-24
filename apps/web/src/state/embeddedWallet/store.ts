import { useSyncExternalStore } from 'react'
import { logger } from 'utilities/src/logger/logger'

interface EmbeddedWalletState {
  walletAddress: string | null
  chainId: number | null
  isConnected: boolean
}

const initialState: EmbeddedWalletState = {
  walletAddress: null,
  chainId: null,
  isConnected: false,
}

const embeddedWalletStateKey = 'embedded-wallet'

let state = initialState
const listeners = new Set<() => void>()

const getSnapshot = () => state

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const setState = (updates: Partial<EmbeddedWalletState>) => {
  state = { ...state, ...updates }
  listeners.forEach((listener) => listener())
  localStorage.setItem(embeddedWalletStateKey, JSON.stringify(state))
}

// Initialize state from localStorage
try {
  const persisted = localStorage.getItem(embeddedWalletStateKey)
  if (persisted) {
    state = JSON.parse(persisted)
  }
} catch {
  logger.info('embeddedWallet', 'store', `No existing embedded wallet state found for key ${embeddedWalletStateKey}`)
}

/**
 * Hook to access and modify embedded wallet state. This is the preferred method of interacting with
 * embedded wallet state. All changes made through this hook are automatically persisted to localStorage.
 * @returns {object} An object containing the current state and setter functions
 * @property {string | null} walletAddress - The current wallet address, or null if not set
 * @property {number | null} chainId - The current chain ID, or null if not set
 * @property {boolean} isConnected - Whether the wallet is currently connected
 * @property {(address: string | null) => void} setWalletAddress - Function to update the wallet address
 * @property {(chainId: number | null) => void} setChainId - Function to update the chain ID
 * @property {(isConnected: boolean) => void} setIsConnected - Function to update the connection status
 */
export function useEmbeddedWalletState() {
  const currentState = useSyncExternalStore(subscribe, getSnapshot)

  return {
    ...currentState,
    setWalletAddress: (address: string | null) => setState({ walletAddress: address }),
    setChainId: (chainId: number | null) => setState({ chainId }),
    setIsConnected: (isConnected: boolean) => setState({ isConnected }),
  }
}

/**
 * Direct accessor for embedded wallet state. Prefer using useEmbeddedWalletState() hook instead
 * as it provides reactive updates and setter functions.
 * @returns {EmbeddedWalletState} The current embedded wallet state
 * @property {string | null} walletAddress - The current wallet address, or null if not set
 * @property {number | null} chainId - The current chain ID, or null if not set
 * @property {boolean} isConnected - Whether the wallet is currently connected
 */
export function getEmbeddedWalletState(): EmbeddedWalletState {
  return getSnapshot()
}

export function setChainId(chainId: number | null) {
  setState({ chainId })
}
