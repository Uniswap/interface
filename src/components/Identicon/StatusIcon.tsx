import { AbstractConnector } from '@web3-react/abstract-connector'

import CoinbaseWalletIcon from '../../assets/images/coinbaseWalletIcon.svg'
import FortmaticIcon from '../../assets/images/fortmaticIcon.png'
import PortisIcon from '../../assets/images/portisIcon.png'
import WalletConnectIcon from '../../assets/images/walletConnectIcon.svg'
import { fortmatic, injected, portis, walletconnect, walletlink } from '../../connectors'
import Identicon from '../Identicon'

export default function StatusIcon({ connector }: { connector: AbstractConnector }) {
  switch (connector) {
    case injected:
      return <Identicon />
    case walletconnect:
      return <img src={WalletConnectIcon} alt={'WalletConnect'} />
    case walletlink:
      return <img src={CoinbaseWalletIcon} alt={'Coinbase Wallet'} />
    case fortmatic:
      return <img src={FortmaticIcon} alt={'Fortmatic'} />
    case portis:
      return <img src={PortisIcon} alt={'Portis'} />
    default:
      return null
  }
}
