import { Connector } from '@web3-react/types'
import { AbstractConnector } from 'web3-react-abstract-connector'

import CoinbaseWalletIcon from '../../assets/images/coinbaseWalletIcon.svg'
import FortmaticIcon from '../../assets/images/fortmaticIcon.png'
import TallyIcon from '../../assets/images/tally.png'
import WalletConnectIcon from '../../assets/images/walletConnectIcon.svg'
import { fortmatic, injectedMetamask, injectedTally, walletconnect, walletlink } from '../../connectors'
import Identicon from '../Identicon'

export default function StatusIcon({ connector }: { connector: AbstractConnector | Connector }) {
  switch (connector) {
    case injectedMetamask:
      return <Identicon />
    case injectedTally:
      return <img src={TallyIcon} alt={'WalletConnect'} />
    case walletconnect:
      return <img src={WalletConnectIcon} alt={'WalletConnect'} />
    case walletlink:
      return <img src={CoinbaseWalletIcon} alt={'Coinbase Wallet'} />
    case fortmatic:
      return <img src={FortmaticIcon} alt={'Fortmatic'} />
    default:
      return null
  }
}
