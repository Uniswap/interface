import { useWeb3React } from '@web3-react/core'
import { Unicon } from 'components/Unicon'
import { Connection } from 'connection/types'
import { useUniconV2Flag } from 'featureFlags/flags/uniconV2'
import useENSAvatar from 'hooks/useENSAvatar'
import styled from 'styled-components'
import { useIsDarkMode } from 'theme/components/ThemeToggle'
import { flexColumnNoWrap } from 'theme/styles'
import { UniconV2 } from 'ui/src'
import { getWalletMeta } from 'utils/walletMeta'

import { navSearchInputVisibleSize } from 'hooks/useScreenSize'
import { useUnitagByAddressWithoutFlag } from 'uniswap/src/features/unitags/hooksWithoutFlags'
import sockImg from '../../assets/svg/socks.svg'
import { useHasSocks } from '../../hooks/useSocksBalance'
import Identicon from '../Identicon'

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

const UnigramContainer = styled.div<{ $iconSize: number }>`
  height: ${({ $iconSize: iconSize }) => `${iconSize}px`};
  width: ${({ $iconSize: iconSize }) => `${iconSize}px`};
  border-radius: 50%;
  background-color: ${({ theme }) => theme.surface3};
  font-size: initial;
`

const Unigram = styled.img`
  height: inherit;
  width: inherit;
  border-radius: inherit;
  object-fit: cover;
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

const MainWalletIcon = ({ account, connection, size }: { account: string; connection: Connection; size: number }) => {
  const { unitag } = useUnitagByAddressWithoutFlag(account, Boolean(account))
  const { avatar } = useENSAvatar(account ?? undefined)
  const uniconV2Enabled = useUniconV2Flag()

  if (!account) return null

  if (unitag && unitag.metadata?.avatar) {
    return (
      <UnigramContainer $iconSize={size}>
        <Unigram alt={unitag.username} src={unitag.metadata.avatar} />
      </UnigramContainer>
    )
  }

  const hasIdenticon = avatar || connection.getProviderInfo().name === 'MetaMask'
  return hasIdenticon ? (
    <Identicon account={account} size={size} />
  ) : uniconV2Enabled ? (
    <UniconV2 address={account} size={size} />
  ) : (
    <Unicon address={account} size={size} />
  )
}

export default function StatusIcon({
  account,
  connection,
  size = 16,
  showMiniIcons = true,
}: {
  account: string
  connection: Connection
  size?: number
  showMiniIcons?: boolean
}) {
  const hasSocks = useHasSocks()

  return (
    <IconWrapper size={size} data-testid="StatusIconRoot">
      <MainWalletIcon account={account} connection={connection} size={size} />
      {showMiniIcons && <MiniWalletIcon connection={connection} side="right" />}
      {hasSocks && showMiniIcons && <Socks />}
    </IconWrapper>
  )
}
