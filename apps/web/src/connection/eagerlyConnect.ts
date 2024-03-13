import { Connector } from '@web3-react/types'
import { useSyncExternalStore } from 'react'
import store from 'state'
import { clearRecentConnectionMeta } from 'state/user/reducer'

import { trace } from 'tracing/trace'
import { deprecatedNetworkConnection, eip6963Connection, getConnection, gnosisSafeConnection } from './index'
import { getRecentConnectionMeta } from './meta'
import { ConnectionType } from './types'

class FailedToConnect extends Error {}

let connectionReady: Promise<void> | true = true

export function useConnectionReady() {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (connectionReady instanceof Promise) {
        connectionReady.finally(onStoreChange)
      }
      return () => undefined
    },
    () => connectionReady === true
  )
}

function connect(connector: Connector, type: ConnectionType) {
  // We intentionally omit setting a non-ok status on this trace, as it is expected to fail.
  // The trace here is intended to capture duration and throughput, not status.
  return trace({ name: 'Connect eagerly', op: 'wallet.connect.eager', tags: { type } }, async () => {
    try {
      if (connector.connectEagerly) {
        await connector.connectEagerly()
      } else {
        await connector.activate()
      }
      return true
    } catch (error) {
      console.debug(`web3-react eager connection error: ${error}`)
      return false
    }
  })
}

// The Safe connector will only work from safe.global, which iframes;
// it is only necessary to try (and to load all the deps) if we are in an iframe.
if (window !== window.parent) {
  connect(gnosisSafeConnection.connector, ConnectionType.GNOSIS_SAFE)
}
connect(deprecatedNetworkConnection.connector, ConnectionType.DEPRECATED_NETWORK)

// Get the persisted wallet type from the last session.
const recentConnectionMeta = getRecentConnectionMeta()
if (recentConnectionMeta?.type && !recentConnectionMeta.disconnected) {
  const selectedConnection = getConnection(recentConnectionMeta.type)

  // All EIP6963 wallets share one Connection object, `eip6963Connection`
  // To activate the same EIP6963 wallet as the last session, we need to `select` the rdns of the recent connection
  if (recentConnectionMeta.rdns) eip6963Connection.selectRdns(recentConnectionMeta.rdns)

  if (selectedConnection) {
    connectionReady = connect(selectedConnection.connector, recentConnectionMeta.type)
      .then((connected) => {
        if (!connected) throw new FailedToConnect()
      })
      .catch((error) => {
        // Clear the persisted wallet type if it failed to connect.
        store.dispatch(clearRecentConnectionMeta())
        // Log it if it threw an unknown error.
        if (!(error instanceof FailedToConnect)) {
          console.error(error)
        }
      })
      .finally(() => {
        connectionReady = true
      })
  }
}
