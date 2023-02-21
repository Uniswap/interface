import { getWalletMeta } from '@uniswap/conedison/provider/meta'
import { useWeb3React } from '@web3-react/core'
import { MouseoverTooltip } from 'components/Tooltip'
import { Unicon } from 'components/Unicon'
import { Connection, ConnectionType } from 'connection'
import useENSAvatar from 'hooks/useENSAvatar'
import ms from 'ms.macro'
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

const SockContainer = styled.div`
  position: absolute;
  display: flex;
  justify-content: center;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  bottom: -4px;
  right: -4px;
`

const SockImg = styled.img`
  width: 16px;
  height: 16px;
`

const Socks = () => {
  return (
    <SockContainer>
      <SockImg src={sockImg} />
    </SockContainer>
  )
}

const Divider = styled.div`
  border-bottom: 1px solid ${({ theme }) => theme.backgroundOutline};
  margin: 12px 0;
`

function UniconTooltip({ children, enabled }: PropsWithChildren<{ enabled?: boolean }>) {
  return (
    <MouseoverTooltip
      timeout={ms`3s`}
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

const useIcon = (connection: Connection, size: number, enableInfotips?: boolean) => {
  const { account, provider } = useWeb3React()
  const { avatar } = useENSAvatar(account ?? undefined)
  const isUniswapWalletConnect = Boolean(provider && getWalletMeta(provider)?.name === 'Uniswap Wallet')

  if (!account) {
    return undefined
  } else if (avatar || connection.type === ConnectionType.INJECTED) {
    return <Identicon size={size} />
  } else if (isUniswapWalletConnect) {
    return (
      <UniconTooltip enabled={enableInfotips}>
        <Unicon address={account} size={size} />
      </UniconTooltip>
    )
  } else {
    return <img src={connection.icon} alt={`${connection.name} icon`} />
  }
}

export default function StatusIcon({
  connection,
  size = 16,
  enableInfotips,
}: {
  connection: Connection
  size?: number
  enableInfotips?: boolean
}) {
  const hasSocks = useHasSocks()
  const icon = useIcon(connection, size, enableInfotips)

  return (
    <IconWrapper size={size}>
      {hasSocks && <Socks />}
      {icon}
    </IconWrapper>
  )
}
