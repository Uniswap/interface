import { Connector } from '@web3-react/types'
import { coinbaseWallet, ConnectionType, fortmatic, gnosisSafe, injected, network, walletConnect } from 'connection'

const CONNECTIONS = [coinbaseWallet, fortmatic, injected, network, walletConnect, gnosisSafe]

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
}
