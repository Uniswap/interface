import type { AccountsState } from 'uniswap/src/features/accounts/store/types/AccountsState'
import { ConnectionStatusInfo, ConnectorStatus } from 'uniswap/src/features/accounts/store/types/Connector'
import { useStoreWithShallow } from 'uniswap/src/features/accounts/store/utils/createUseAccountsStore'
import { StoreApi, UseBoundStore } from 'zustand'

/**
 * Factory function that creates a useActiveConnector hook for a specific accounts store context.
 * Returns the currently active connector for the specified platform.
 */
export function createUseActiveConnector<TAccountsState extends AccountsState>(
  useAccountsStoreCtx: () => UseBoundStore<StoreApi<TAccountsState>>,
): TAccountsState['getActiveConnector'] {
  return (platform) => {
    return useStoreWithShallow(useAccountsStoreCtx, ({ getActiveConnector }) => getActiveConnector(platform))
  }
}

/**
 * Factory function that creates a useConnectionStatus hook for a specific accounts store context.
 * Returns the connection status for the specified platform.
 */
export function createUseConnectionStatus<TAccountsState extends AccountsState>(
  useAccountsStoreCtx: () => UseBoundStore<StoreApi<TAccountsState>>,
): TAccountsState['getConnectionStatus'] {
  return (platform) => {
    return useStoreWithShallow(useAccountsStoreCtx, ({ getConnectionStatus }) => getConnectionStatus(platform))
  }
}

export function toConnectionStatusInfo(status: ConnectorStatus): ConnectionStatusInfo {
  if (status === ConnectorStatus.Connected) {
    return { status, isConnected: true, isConnecting: false, isDisconnected: false }
  }

  if (status === ConnectorStatus.Connecting) {
    return { status, isConnected: false, isConnecting: true, isDisconnected: false }
  }

  return { status, isConnected: false, isConnecting: false, isDisconnected: true }
}
