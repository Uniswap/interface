import { ConnectionType } from 'connection'
import { NavBarVariant, useNavBarFlag } from 'featureFlags/flags/navBar'
import styled from 'styled-components/macro'
import { colors } from 'theme/colors'

import CoinbaseWalletIcon from '../../assets/images/coinbaseWalletIcon.svg'
import WalletConnectIcon from '../../assets/images/walletConnectIcon.svg'
import sockImg from '../../assets/svg/socks.svg'
import { useHasSocks } from '../../hooks/useSocksBalance'
import Identicon from '../Identicon'

const IconWrapper = styled.div<{ size?: number }>`
  position: relative;
  ${({ theme }) => theme.flexColumnNoWrap};
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  & > img,
  span {
    height: ${({ size }) => (size ? size + 'px' : '32px')};
    width: ${({ size }) => (size ? size + 'px' : '32px')};
  }
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToMedium`
    align-items: flex-end;
  `};
`

const SockContainer = styled.div`
  position: absolute;
  background-color: ${colors.pink400};
  display: flex;
  justify-content: center;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  bottom: -5px;
  right: -5px;
`

const SockImg = styled.img`
  width: 7.5px;
  height: 10px;
  margin-top: 3px;
`

const Socks = () => {
  return (
    <SockContainer>
      <SockImg src={sockImg} />
    </SockContainer>
  )
}

export default function StatusIcon({ connectionType, size }: { connectionType: ConnectionType; size?: number }) {
  const hasSocks = useHasSocks()
  const navbarFlag = useNavBarFlag()
  const isNavbarEnabled = navbarFlag === NavBarVariant.Enabled

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
  }

  return (
    <IconWrapper size={size ?? 16}>
      {isNavbarEnabled ? (
        <span>
          {hasSocks && <Socks />}
          {isNavbarEnabled ? <Identicon /> : image}
        </span>
      ) : null}
    </IconWrapper>
  )
}
