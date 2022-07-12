import { Connector } from '@web3-react/types'
import WALLET_CONNECT_ICON_URL from 'assets/images/walletConnectIcon.svg'
import { ConnectionType, walletConnectConnection } from 'connection'
import { getConnectionName, getIsCoinbaseWallet, getIsMetaMask } from 'connection/utils'
import { isMobile } from 'utils/userAgent'

import Option from './Option'

const BASE_PROPS = {
  color: '#4196FC',
  icon: WALLET_CONNECT_ICON_URL,
  id: 'wallet-connect',
}

const WalletConnectOption = ({ tryActivation }: { tryActivation: (connector: Connector) => void }) => {
  const isActive = walletConnectConnection.hooks.useIsActive()

  const isMetaMask = getIsMetaMask()
  const isCoinbaseWallet = getIsCoinbaseWallet()
  if (isMobile && (isMetaMask || isCoinbaseWallet)) return null

  return (
    <Option
      {...BASE_PROPS}
      isActive={isActive}
      onClick={() => tryActivation(walletConnectConnection.connector)}
      header={getConnectionName(ConnectionType.WALLET_CONNECT)}
    />
  )
}

export default WalletConnectOption
