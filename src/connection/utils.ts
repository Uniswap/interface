import { Connector } from '@web3-react/types'
import {
  coinbaseWalletConnection,
  ConnectionType,
  fortmaticConnection,
  gnosisSafeConnection,
  infuraConnection,
  injectedConnection,
  walletConnectConnection,
} from 'connection'

const CONNECTIONS = [
  coinbaseWalletConnection,
  fortmaticConnection,
  injectedConnection,
  infuraConnection,
  walletConnectConnection,
  gnosisSafeConnection,
]

export function getConnection(c: Connector | ConnectionType) {
  if (c instanceof Connector) {
    const connection = CONNECTIONS.find((connection) => connection.connector === c)
    if (!connection) {
      throw Error('unsupported connector')
    }
    return connection
  } else {
    switch (c) {
      case ConnectionType.INJECTED:
        return injectedConnection
      case ConnectionType.COINBASE_WALLET:
        return coinbaseWalletConnection
      case ConnectionType.WALLET_CONNECT:
        return walletConnectConnection
      case ConnectionType.FORTMATIC:
        return fortmaticConnection
      case ConnectionType.INFURA:
        return infuraConnection
      case ConnectionType.GNOSIS_SAFE:
        return gnosisSafeConnection
    }
  }
}
