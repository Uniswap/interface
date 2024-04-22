import { useWeb3React } from '@web3-react/core'
import Identicon from 'components/Identicon'
import { Connection } from 'connection/types'
import { navSearchInputVisibleSize } from 'hooks/useScreenSize'
import { useHasSocks } from 'hooks/useSocksBalance'
import styled from 'styled-components'
import { useIsDarkMode } from 'theme/components/ThemeToggle'
import { flexColumnNoWrap } from 'theme/styles'
import { getWalletMeta } from 'utils/walletMeta'
import sockImg from '../../assets/svg/socks.svg'

export const IconWrapper = styled.div<{ size?: number }>`
  position: relative;
  ${flexColumnNoWrap};
  align-items: center;
  justify-content: center;
  @media only screen and (min-width: ${navSearchInputVisibleSize}px) {
    margin-right: 4px;
  }
  & > img,
  span {
    height: ${({ size }) => (size ? size + 'px' : '32px')};
    width: ${({ size }) => (size ? size + 'px' : '32px')};
  }
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToMedium`
    align-items: flex-end;
  `};
`

const MiniIconContainer = styled.div<{ side: 'left' | 'right' }>`
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 16px;
  height: 16px;
  bottom: -4px;
  ${({ side }) => `${side === 'left' ? 'left' : 'right'}: -4px;`}
  border-radius: 50%;
  outline: 2px solid ${({ theme }) => theme.surface1};
  outline-offset: -0.1px;
  background-color: ${({ theme }) => theme.surface1};
  overflow: hidden;
  @supports (overflow: clip) {
    overflow: clip;
  }
`

const MiniImg = styled.img`
  width: 16px;
  height: 16px;
`

const Socks = () => {
  return (
    <MiniIconContainer side="left">
      <MiniImg src={sockImg} />
    </MiniIconContainer>
  )
}

const MiniWalletIcon = ({ connection, side }: { connection: Connection; side: 'left' | 'right' }) => {
  const isDarkMode = useIsDarkMode()
  const { provider } = useWeb3React()

  const providerInfo = connection.getProviderInfo(isDarkMode)

  // Uses icon from wallet meta when available, otherwise uses icon from connection
  const icon = (provider && getWalletMeta(provider)?.icons?.[0]) ?? providerInfo.icon

  return (
    <MiniIconContainer side={side}>
      <MiniImg src={icon} alt={`${providerInfo.name} icon`} />
    </MiniIconContainer>
  )
}

export default function StatusIcon({
  account,
  connection,
  size = 16,
  showMiniIcons = true,
}: {
  account?: string
  connection: Connection
  size?: number
  showMiniIcons?: boolean
}) {
  const hasSocks = useHasSocks()

  return (
    <IconWrapper size={size} data-testid="StatusIconRoot">
      <Identicon account={account} size={size} />
      {showMiniIcons && <MiniWalletIcon connection={connection} side="right" />}
      {hasSocks && showMiniIcons && <Socks />}
    </IconWrapper>
  )
}
