import './wc2.css'

import { Connector } from '@web3-react/types'
import WALLET_CONNECT_ICON_URL from 'assets/images/walletConnectIcon.svg'
import { ConnectionType, walletConnectV2Connection } from 'connection'
import { getConnectionName } from 'connection/utils'

import Option from './Option'

const BASE_PROPS = {
  color: '#4196FC',
  icon: WALLET_CONNECT_ICON_URL,
  id: 'wallet-connect',
}

export function WalletConnectV2Option({ tryActivation }: { tryActivation: (connector: Connector) => void }) {
  const isActive = walletConnectV2Connection.hooks.useIsActive()
  return (
    <Option
      {...BASE_PROPS}
      isActive={isActive}
      onClick={() => tryActivation(walletConnectV2Connection.connector)}
      header={getConnectionName(ConnectionType.WALLET_CONNECT_V2)}
    />
  )
}
