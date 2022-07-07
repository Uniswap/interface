import { Connector } from '@web3-react/types'
import { coinbaseWallet, fortmatic, injected, walletConnect } from 'connection'

import CoinbaseWalletIcon from '../../assets/images/coinbaseWalletIcon.svg'
import FortmaticIcon from '../../assets/images/fortmaticIcon.png'
import WalletConnectIcon from '../../assets/images/walletConnectIcon.svg'
import Identicon from '../Identicon'

export default function StatusIcon({ connector }: { connector: Connector }) {
  switch (connector) {
    case injected.connector:
      return <Identicon />
    case walletConnect.connector:
      return <img src={WalletConnectIcon} alt="WalletConnect" />
    case coinbaseWallet.connector:
      return <img src={CoinbaseWalletIcon} alt="Coinbase Wallet" />
    case fortmatic.connector:
      return <img src={FortmaticIcon} alt="Fortmatic" />
    default:
      return null
  }
}
