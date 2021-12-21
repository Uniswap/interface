import { AbstractConnector } from '@web3-react/abstract-connector'

import WalletConnectIcon from '../../assets/images/walletConnectIcon.svg'
import { injected, walletconnect } from '../../connectors'
import Identicon from '../Identicon'

export default function StatusIcon({ connector }: { connector: AbstractConnector }) {
  switch (connector) {
    case injected:
      return <Identicon />
    case walletconnect:
      return <img src={WalletConnectIcon} alt={'WalletConnect'} />
    default:
      return null
  }
}
