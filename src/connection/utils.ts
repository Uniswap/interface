import { Connector } from '@web3-react/types'
import { coinbaseWallet, ConnectionType, fortmatic, gnosisSafe, injected, network, walletConnect } from 'connection'

const CONNECTIONS = [coinbaseWallet, fortmatic, injected, network, walletConnect, gnosisSafe]

export function getConnectionForConnector(connector: Connector) {
  const connection = CONNECTIONS.find((c) => c.connector === connector)
  if (!connection) {
    throw Error('unsupported connector')
  }
  return connection
}

export function getConnectionForConnectionType(connectionType: ConnectionType) {
  switch (connectionType) {
    case ConnectionType.INJECTED:
      return injected
    case ConnectionType.COINBASE_WALLET:
      return coinbaseWallet
    case ConnectionType.WALLET_CONNECT:
      return walletConnect
    case ConnectionType.FORTMATIC:
      return fortmatic
    case ConnectionType.NETWORK:
      return network
    case ConnectionType.GNOSIS_SAFE:
      return gnosisSafe
  }
}
