import { Connector } from '@web3-react/types'
import { walletConnectConnection } from 'connection'

import WALLET_CONNECT_ICON_URL from '../assets/images/walletConnectIcon.png'
import Option from './Option'

const BASE_PROPS = {
  color: '#4196FC',
  icon: WALLET_CONNECT_ICON_URL,
  id: 'wallet-connect',
}

const WalletConnectOption = ({ tryActivation }: { tryActivation: (connector: Connector) => void }) => {
  const isActive = walletConnectConnection.hooks.useIsActive()

  return (
    <Option
      {...BASE_PROPS}
      isActive={isActive}
      onClick={() => tryActivation(walletConnectConnection.connector)}
      header="WalletConnect"
      subheader="Connect to Trust Wallet, Rainbow Wallet and more..."
    />
  )
}

export default WalletConnectOption
