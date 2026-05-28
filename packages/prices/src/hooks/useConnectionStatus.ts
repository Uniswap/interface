import { usePricesContext } from '@universe/prices/src/context/PriceServiceContext'
import type { ConnectionStatus } from '@universe/websocket'
import { useCallback, useSyncExternalStore } from 'react'

const DISCONNECTED: ConnectionStatus = 'disconnected'
const noopSubscribe = (): (() => void) => () => {}

/**
 * Hook to get the current WebSocket connection status.
 * Returns 'disconnected' when no WebSocket client is configured (REST-only mode).
 */
export function useConnectionStatus(): ConnectionStatus {
  const { wsClient } = usePricesContext()
  const subscribe = useCallback(
    (onStoreChange: () => void) => (wsClient ? wsClient.onStatusChange(onStoreChange) : noopSubscribe()),
    [wsClient],
  )
  const getSnapshot = useCallback(() => (wsClient ? wsClient.getConnectionStatus() : DISCONNECTED), [wsClient])
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
