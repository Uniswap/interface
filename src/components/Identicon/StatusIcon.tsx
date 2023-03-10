import { getWalletMeta } from '@uniswap/conedison/provider/meta'
import { useWeb3React } from '@web3-react/core'
import { MouseoverTooltip } from 'components/Tooltip'
import { Unicon } from 'components/Unicon'
import { ConnectionType } from 'connection'
import useENSAvatar from 'hooks/useENSAvatar'
import ms from 'ms.macro'
import { PropsWithChildren } from 'react'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'
import { flexColumnNoWrap } from 'theme/styles'

import CoinbaseWalletIcon from '../../assets/images/coinbaseWalletIcon.svg'
import WalletConnectIcon from '../../assets/images/walletConnectIcon.svg'
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

const useIcon = (connectionType: ConnectionType, size?: number, enableInfotips?: boolean) => {
  const { account, provider } = useWeb3React()
  const { avatar } = useENSAvatar(account ?? undefined)
  const isUniswapWallet = Boolean(provider && getWalletMeta(provider)?.name === 'Uniswap Wallet')

  if (!account) return null

  if (avatar || connectionType === ConnectionType.INJECTED) {
    return <Identicon />
  } else if (connectionType === ConnectionType.WALLET_CONNECT) {
    return isUniswapWallet ? (
      <UniconTooltip enabled={enableInfotips}>
        <Unicon address={account} size={size} />
      </UniconTooltip>
    ) : (
      <img src={WalletConnectIcon} alt="WalletConnect" />
    )
  } else if (connectionType === ConnectionType.COINBASE_WALLET) {
    return <img src={CoinbaseWalletIcon} alt="Coinbase Wallet" />
  }

  return undefined
}

export default function StatusIcon({
  connectionType,
  size,
  enableInfotips,
}: {
  connectionType: ConnectionType
  size?: number
  enableInfotips?: boolean
}) {
  const hasSocks = useHasSocks()
  const icon = useIcon(connectionType, size, enableInfotips)

  return (
    <IconWrapper size={size ?? 16}>
      {hasSocks && <Socks />}
      {icon}
    </IconWrapper>
  )
}
