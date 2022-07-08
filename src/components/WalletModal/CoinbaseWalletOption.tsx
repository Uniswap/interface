import { Connector } from '@web3-react/types'
import COINBASE_ICON_URL from 'assets/images/coinbaseWalletIcon.svg'
import { coinbaseWalletConnection, ConnectionType } from 'connection'
import { getConnectionName } from 'connection/utils'

import { isMobile } from '../../utils/userAgent'
import Option from './Option'

const BASE_PROPS = {
  color: '#315CF5',
  icon: COINBASE_ICON_URL,
  id: 'coinbase-wallet',
}

const CoinbaseWalletOption = ({ tryActivation }: { tryActivation: (connector: Connector) => void }) => {
  const isActive = coinbaseWalletConnection.hooks.useIsActive()
  const isCoinbaseWallet = !!window.ethereum?.isCoinbaseWallet

  if (!isMobile || isCoinbaseWallet) {
    return <Option {...BASE_PROPS} isActive={isActive} header={getConnectionName(ConnectionType.COINBASE_WALLET)} />
  } else {
    return (
      <Option
        {...BASE_PROPS}
        isActive={isActive}
        onClick={() => tryActivation(coinbaseWalletConnection.connector)}
        link="https://go.cb-w.com/mtUDhEZPy1"
        header="Open in Coinbase Wallet"
      />
    )
  }
}

export default CoinbaseWalletOption
