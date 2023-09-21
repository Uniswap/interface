import { Connector } from '@web3-react/types'
import { useSyncExternalStore } from 'react'

import { getConnection, gnosisSafeConnection, networkConnection } from './index'
import { ConnectionType, selectedWalletKey, toConnectionType } from './types'

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

async function connect(connector: Connector, type: ConnectionType) {
  performance.mark(`web3:connect:${type}:start`)
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
  } finally {
    performance.measure(`web3:connect:${type}`, `web3:connect:${type}:start`)
  }
}

class FailedToConnect extends Error {}

connect(gnosisSafeConnection.connector, ConnectionType.GNOSIS_SAFE)
connect(networkConnection.connector, ConnectionType.NETWORK)
const selectedWallet = toConnectionType(localStorage.getItem(selectedWalletKey) ?? undefined)
if (selectedWallet) {
  const selectedConnection = getConnection(selectedWallet)
  if (selectedConnection) {
    connectionReady = connect(selectedConnection.connector, selectedWallet)
      .then((connected) => {
        if (!connected) throw new FailedToConnect()
      })
      .catch((error) => {
        // Clear the persisted wallet type if it failed to connect.
        localStorage.removeItem(selectedWalletKey)
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
