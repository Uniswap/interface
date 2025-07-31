import { ConnectWalletService } from 'features/wallet/connection/services/ConnectWalletService'
import { WalletConnectorMeta } from 'features/wallet/connection/types/WalletConnectorMeta'
import { useSyncExternalStore } from 'react'
import { UserRejectedRequestError } from 'utils/errors'

export enum ConnectionStatus {
  Idle = 'idle',
  Pending = 'pending',
}

class ExistingPendingConnectionError extends Error {
  existingConnectorId: string
  constructor(existingConnectorId: string) {
    super(`Already connecting to ${existingConnectorId}`)
    this.existingConnectorId = existingConnectorId
  }
}

type ConnectionState =
  | {
      status: ConnectionStatus.Idle
      error?: string
    }
  | {
      status: ConnectionStatus.Pending
      meta: WalletConnectorMeta
    }

// External store for connection states
let CONNECTION_STATE: ConnectionState = {
  status: ConnectionStatus.Idle,
  error: undefined,
}

function getConnectionState(): ConnectionState {
  return CONNECTION_STATE
}

const listeners: Set<() => void> = new Set()

// Store functions
function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function setState(newState: ConnectionState): void {
  CONNECTION_STATE = newState
  listeners.forEach((listener) => listener())
}

// Utility to update connection state
export function updateConnectionState(state: ConnectionState): void {
  setState(state)
}

// Hook to access connection state for a specific wallet connector=
export function useConnectionState(): ConnectionState {
  return useSyncExternalStore(subscribe, getConnectionState)
}

/** Wraps a connect wallet service with functionality to update global connection state. Filters out user rejection errors. */
export function wrapConnectWalletServiceWithStateTracking(service: ConnectWalletService): ConnectWalletService {
  return {
    connect: async (params: { walletConnector: WalletConnectorMeta }) => {
      try {
        if (CONNECTION_STATE.status === ConnectionStatus.Pending) {
          throw new ExistingPendingConnectionError(CONNECTION_STATE.meta.name)
        }

        // Set state to pending
        updateConnectionState({ status: ConnectionStatus.Pending, meta: params.walletConnector })

        await service.connect(params)

        // Set state to connected on success
        updateConnectionState({ status: ConnectionStatus.Idle })
      } catch (error) {
        if (error instanceof UserRejectedRequestError || error instanceof ExistingPendingConnectionError) {
          updateConnectionState({ status: ConnectionStatus.Idle })
          return
        }

        // Set state to error on failure
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        updateConnectionState({ status: ConnectionStatus.Idle, error: errorMessage })
        throw error // Re-throw the error to maintain original behavior
      }
    },
  }
}

// eslint-disable-next-line import/no-unused-modules
export function __resetConnectionStateForTest() {
  CONNECTION_STATE = { status: ConnectionStatus.Idle, error: undefined }
  listeners.clear()
}
