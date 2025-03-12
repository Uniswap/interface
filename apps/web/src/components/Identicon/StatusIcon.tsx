import sockImg from 'assets/svg/socks.svg'
import Identicon from 'components/Identicon'
import { CONNECTOR_ICON_OVERRIDE_MAP } from 'components/Web3Provider/constants'
import { useAccount } from 'hooks/useAccount'
import { useHasSocks } from 'hooks/useSocksBalance'
import styled from 'lib/styled-components'
import { flexColumnNoWrap } from 'theme/styles'
import { breakpoints } from 'ui/src/theme'

const IconWrapper = styled.div<{ size?: number }>`
  position: relative;
  ${flexColumnNoWrap};
  align-items: center;
  justify-content: center;
  @media only screen and (min-width: ${breakpoints.xl}px) {
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

function Socks() {
  return (
    <MiniIconContainer side="left">
      <MiniImg src={sockImg} />
    </MiniIconContainer>
  )
}

function MiniWalletIcon() {
  const { connector } = useAccount()
  if (!connector) {
    return null
  }

  const icon = CONNECTOR_ICON_OVERRIDE_MAP[connector.id] ?? connector.icon

  return (
    <MiniIconContainer side="right" data-testid="MiniIcon">
      <MiniImg src={icon} alt={`${connector.name} icon`} />
    </MiniIconContainer>
  )
}

export default function StatusIcon({ size = 16, showMiniIcons = true }: { size?: number; showMiniIcons?: boolean }) {
  const account = useAccount()
  const hasSocks = useHasSocks()
  return (
    <IconWrapper size={size} data-testid="StatusIconRoot">
      <Identicon account={account.address} size={size} />
      {showMiniIcons && <MiniWalletIcon />}
      {hasSocks && showMiniIcons && <Socks />}
    </IconWrapper>
  )
}
