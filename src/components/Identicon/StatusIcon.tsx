import { useWeb3React } from '@web3-react/core'
import { MouseoverTooltip } from 'components/Tooltip'
import { Unicon } from 'components/Unicon'
import { Connection, ConnectionType } from 'connection'
import useENSAvatar from 'hooks/useENSAvatar'
import { useIsMobile } from 'nft/hooks'
import { PropsWithChildren } from 'react'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'
import { flexColumnNoWrap } from 'theme/styles'

import sockImg from '../../assets/svg/socks.svg'
import { useHasSocks } from '../../hooks/useSocksBalance'
import Identicon from '../Identicon'

export const IconWrapper = styled.div<{ size?: number }>`
  position: relative;
  ${flexColumnNoWrap};
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
  outline: 2px solid ${({ theme }) => theme.backgroundSurface};
  outline-offset: -0.1px;
  background-color: ${({ theme }) => theme.backgroundSurface};
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
  return (
    <MiniIconContainer side={side}>
      <MiniImg src={connection.icon} alt={`${connection.name} icon`} />
    </MiniIconContainer>
  )
}

const Divider = styled.div`
  border-bottom: 1px solid ${({ theme }) => theme.backgroundOutline};
  margin: 12px 0;
`

function UniconTooltip({ children, enabled }: PropsWithChildren<{ enabled?: boolean }>) {
  return (
    <MouseoverTooltip
      offsetY={8}
      disableHover={!enabled}
      text={
        // TODO(cartcrom): add Learn More link when unicon microsite is polished
        <>
          <ThemedText.SubHeaderSmall color="textPrimary" paddingTop="4px">
            This is your Unicon
          </ThemedText.SubHeaderSmall>
          <Divider />
          <ThemedText.Caption paddingBottom="4px">
            Unicons are avatars for your wallet, generated from your address.
          </ThemedText.Caption>
        </>
      }
      placement="bottom"
    >
      <div>{children}</div>
    </MouseoverTooltip>
  )
}

const MainWalletIcon = ({
  connection,
  size,
  enableInfotips,
}: {
  connection: Connection
  size: number
  enableInfotips?: boolean
}) => {
  const { account } = useWeb3React()
  const { avatar } = useENSAvatar(account ?? undefined)
  const isMobile = useIsMobile()

  if (!account) {
    return null
  } else if (avatar || (connection.type === ConnectionType.INJECTED && connection.name === 'MetaMask')) {
    return <Identicon size={size} />
  } else {
    return isMobile ? (
      <Unicon address={account} size={size} />
    ) : (
      <UniconTooltip enabled={enableInfotips}>
        <Unicon address={account} size={size} />
      </UniconTooltip>
    )
  }
}

export default function StatusIcon({
  connection,
  size = 16,
  enableInfotips,
  showMiniIcons = true,
}: {
  connection: Connection
  size?: number
  enableInfotips?: boolean
  showMiniIcons?: boolean
}) {
  const hasSocks = useHasSocks()

  return (
    <IconWrapper size={size}>
      {hasSocks && showMiniIcons && <Socks />}
      <MainWalletIcon connection={connection} size={size} enableInfotips={enableInfotips} />
      {showMiniIcons && <MiniWalletIcon connection={connection} side="right" />}
    </IconWrapper>
  )
}
