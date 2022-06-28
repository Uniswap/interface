import { Connector } from '@web3-react/types'

import CoinbaseWalletIcon from '../../assets/images/coinbaseWalletIcon.svg'
import FortmaticIcon from '../../assets/images/fortmaticIcon.png'
import MetamaskIcon from '../../assets/images/metamask.png'
import TallyIcon from '../../assets/images/tally.png'
import WalletConnectIcon from '../../assets/images/walletConnectIcon.svg'
import { coinbaseWallet, fortmatic, injected, metaMask, tally, walletConnect } from '../../connectors'
import Identicon from '../Identicon'

export default function StatusIcon({ connector }: { connector: Connector }) {
  switch (connector) {
    case injected:
      return <Identicon />
    case metaMask:
      return <img src={MetamaskIcon} alt="MetaMask" />
    case tally:
      return <img src={TallyIcon} alt="Tally Ho" />
    case walletConnect:
      return <img src={WalletConnectIcon} alt="WalletConnect" />
    case coinbaseWallet:
      return <img src={CoinbaseWalletIcon} alt="Coinbase Wallet" />
    case fortmatic:
      return <img src={FortmaticIcon} alt="Fortmatic" />
    default:
      return null
  }
}
