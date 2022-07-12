import { ConnectionType } from 'connection'
import styled from 'styled-components/macro'

import CoinbaseWalletIcon from '../../assets/images/coinbaseWalletIcon.svg'
import FortmaticIcon from '../../assets/images/fortmaticIcon.png'
import WalletConnectIcon from '../../assets/images/walletConnectIcon.svg'
import Identicon from '../Identicon'

const IconWrapper = styled.div<{ size?: number }>`
  ${({ theme }) => theme.flexColumnNoWrap};
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  & > img,
  span {
    height: ${({ size }) => (size ? size + 'px' : '32px')};
    width: ${({ size }) => (size ? size + 'px' : '32px')};
  }
  ${({ theme }) => theme.mediaWidth.upToMedium`
    align-items: flex-end;
  `};
`

export default function StatusIcon({ connectionType }: { connectionType: ConnectionType }) {
  let image
  switch (connectionType) {
    case ConnectionType.INJECTED:
      image = <Identicon />
      break
    case ConnectionType.WALLET_CONNECT:
      image = <img src={WalletConnectIcon} alt="WalletConnect" />
      break
    case ConnectionType.COINBASE_WALLET:
      image = <img src={CoinbaseWalletIcon} alt="Coinbase Wallet" />
      break
    case ConnectionType.FORTMATIC:
      image = <img src={FortmaticIcon} alt="Fortmatic" />
      break
  }

  return <IconWrapper size={16}>{image}</IconWrapper>
}
