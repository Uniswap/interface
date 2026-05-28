import type { ConnectionStatus } from '@universe/websocket/src/types'

export interface ConnectionStore {
  getStatus(): ConnectionStatus
  setStatus(status: ConnectionStatus): void
  getConnectionId(): string | null
  setConnectionId(id: string | null): void
  getError(): Error | null
  setError(error: Error | null): void
  reset(): void
  onStatusChange(callback: (status: ConnectionStatus) => void): () => void
}

export interface CreateZustandConnectionStoreOptions {
  enableDevtools?: boolean
  devtoolsName?: string
}
