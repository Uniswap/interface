import type { ConnectionStore, CreateZustandConnectionStoreOptions } from '@universe/websocket/src/store/types'
import type { ConnectionStatus } from '@universe/websocket/src/types'
import { devtools } from 'zustand/middleware'
import { createStore } from 'zustand/vanilla'

interface ConnectionStoreState {
  status: ConnectionStatus
  connectionId: string | null
  error: Error | null
}

/**
 * Creates a Zustand-backed ConnectionStore.
 * This is a convenience implementation — consumers can provide any object
 * that satisfies the ConnectionStore interface.
 */
export function createZustandConnectionStore(options?: CreateZustandConnectionStoreOptions): ConnectionStore {
  const { enableDevtools = false, devtoolsName = 'websocketConnectionStore' } = options ?? {}

  const store = createStore<ConnectionStoreState>()(
    devtools(
      () => ({
        status: 'disconnected' as ConnectionStatus,
        connectionId: null,
        error: null,
      }),
      {
        name: devtoolsName,
        enabled: enableDevtools,
      },
    ),
  )

  return {
    getStatus(): ConnectionStatus {
      return store.getState().status
    },

    setStatus(status: ConnectionStatus): void {
      store.setState({ status }, false, 'setStatus')
    },

    getConnectionId(): string | null {
      return store.getState().connectionId
    },

    setConnectionId(id: string | null): void {
      store.setState({ connectionId: id }, false, 'setConnectionId')
    },

    getError(): Error | null {
      return store.getState().error
    },

    setError(error: Error | null): void {
      store.setState({ error }, false, 'setError')
    },

    reset(): void {
      store.setState({ status: 'disconnected', connectionId: null, error: null }, false, 'reset')
    },

    onStatusChange(callback: (status: ConnectionStatus) => void): () => void {
      let previousStatus = store.getState().status
      return store.subscribe(() => {
        const currentStatus = store.getState().status
        if (currentStatus !== previousStatus) {
          previousStatus = currentStatus
          callback(currentStatus)
        }
      })
    },
  }
}
