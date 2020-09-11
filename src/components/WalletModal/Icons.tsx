import React from 'react'
import MetamaskIcon from '../../assets/images/metamask.png'
import CoinbaseWalletIcon from '../../assets/images/coinbaseWalletIcon.svg'
import FortmaticIcon from '../../assets/images/fortmaticIcon.png'
import PortisIcon from '../../assets/images/portisIcon.png'
import WalletConnectIcon from '../../assets/images/walletConnectIcon.svg'
import ArrowRight from '../../assets/images/walletConnectIcon.svg'

const Icons: FC = ({ name }: { name: string }) => {
  switch (name) {
    case 'coinbase':
      return <CoinbaseWalletIcon />
    case 'metamask':
      return <img src={MetamaskIcon} />
    case 'portis':
      return <img src={PortisIcon} />
    case 'fortmatic':
      return <img src={FortmaticIcon} />
    case 'walletConnect':
      return <WalletConnectIcon />
    case 'injected':
      return <ArrowRight />
    default:
      null
  }
}

export default Icons
