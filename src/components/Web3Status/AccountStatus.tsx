import { ChainId } from '@swapr/sdk'
import React, { useEffect, useState } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components'
import { useNetworkSwitcherPopoverToggle } from '../../state/application/hooks'
import { TYPE } from '../../theme'
import { shortenAddress } from '../../utils'
import Loader from '../Loader'
import NetworkSwitcherPopover from '../NetworkSwitcherPopover'
import { RowBetween } from '../Row'
import EthereumLogo from '../../assets/svg/ethereum-logo.svg'
import XDAILogo from '../../assets/svg/xdai-logo.svg'
import ArbitrumLogo from '../../assets/svg/arbitrum-one-logo.svg'
import { TriangleIcon } from '../Icons'
import { AbstractConnector } from '@web3-react/abstract-connector'
import { CustomNetworkConnector } from '../../connectors/CustomNetworkConnector'
import { InjectedConnector } from '@web3-react/injected-connector'
import { ApplicationModal } from '../../state/application/actions'
import { ChainLabel } from '../../constants'
import { ENSAvatarData } from '../../hooks/useENSAvatar'

const ChainLogo: any = {
  [ChainId.MAINNET]: EthereumLogo,
  [ChainId.RINKEBY]: EthereumLogo,
  [ChainId.ARBITRUM_ONE]: ArbitrumLogo,
  [ChainId.ARBITRUM_RINKEBY]: ArbitrumLogo,
  [ChainId.XDAI]: XDAILogo
}

const View = styled.div`
  height: 32px;
  display: flex;
  align-items: center;
  margin-left: auto;
  background-color: ${({ theme }) => theme.dark1};
  border: solid 2px transparent;
  color: ${({ theme }) => theme.purple2};
  border-radius: 12px;
  white-space: nowrap;
  margin-left: 8px;
`

const Web3StatusConnected = styled.button<{ pending?: boolean }>`
  height: 29px;
  padding: 0 8px;
  background: none;
  border: none;
  color: ${({ pending, theme }) => (pending ? theme.white : theme.text4)};
  font-weight: 700;
  font-size: 11px;
  line-height: 13px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  outline: none;
  display: flex;
  align-items: center;
`

const Web3StatusNetwork = styled.button<{ pendingTransactions?: boolean; isConnected: boolean; clickable: boolean }>`
  display: flex;
  align-items: center;
  height: 28px;
  padding: 7px 8px;
  font-size: 12px;
  line-height: 15px;
  text-align: center;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #ffffff;
  border-radius: 10px;
  background-color: ${({ theme, isConnected }) => (isConnected ? theme.dark2 : 'transparent')};
  border: none;
  outline: none;
  cursor: ${props => (props.clickable ? 'pointer' : 'initial')};
`

const IconWrapper = styled.div<{ size?: number | null }>`
  ${({ theme }) => theme.flexColumnNoWrap};
  align-items: center;
  justify-content: center;

  & > img,
  span {
    height: ${({ size }) => (size ? size + 'px' : '30px')};
  }

  ${({ theme }) => theme.mediaWidth.upToMedium`
    align-items: center;
  `};
`

const NetworkName = styled.div`
  ${({ theme }) => theme.mediaWidth.upToMedium`
    display: none;
  `};
`

const AddressDesktop = styled.span`
  display: block;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    display: none;
  `};
`

const AddressMobile = styled.span`
  display: none;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    display: block;
  `};
`

export interface StyledAvatarProps {
  url: string
}

const Avatar = styled.div<StyledAvatarProps>(props => ({
  height: 32,
  width: 32,
  borderRadius: '50%',
  marginRight: 6,
  marginLeft: -12,
  backgroundColor: props.theme.bg1,
  backgroundSize: 'cover',
  backgroundImage: `url(${props.url})`
}))

interface AccountStatusProps {
  pendingTransactions: string[]
  ENSName?: string
  avatar?: ENSAvatarData
  account: string | undefined | null
  connector: AbstractConnector | undefined
  networkConnectorChainId: ChainId | undefined
  onAddressClick: () => void
}

export function AccountStatus({
  pendingTransactions,
  ENSName,
  account,
  connector,
  networkConnectorChainId,
  onAddressClick,
  avatar
}: AccountStatusProps) {
  const hasPendingTransactions = !!pendingTransactions.length
  const toggleNetworkSwitcherPopover = useNetworkSwitcherPopoverToggle()
  const [networkSwitchingActive, setNetworkSwitchingActive] = useState(false)

  useEffect(() => {
    setNetworkSwitchingActive(connector instanceof CustomNetworkConnector || connector instanceof InjectedConnector)
  }, [connector])

  if (!networkConnectorChainId) return null

  return (
    <View>
      {account && (
        <Web3StatusConnected id="web3-status-connected" onClick={onAddressClick} pending={hasPendingTransactions}>
          {hasPendingTransactions ? (
            <RowBetween>
              <Text fontSize={13} marginRight="5px">
                {pendingTransactions?.length} Pending
              </Text>{' '}
              <Loader />
            </RowBetween>
          ) : ENSName ? (
            <>
              {avatar && <Avatar url={avatar.image} />}
              <>{ENSName}</>
            </>
          ) : (
            <>
              <AddressDesktop>{shortenAddress(account)}</AddressDesktop>
              <AddressMobile>{shortenAddress(account, 2)}</AddressMobile>
            </>
          )}
        </Web3StatusConnected>
      )}
      <NetworkSwitcherPopover modal={ApplicationModal.NETWORK_SWITCHER}>
        <Web3StatusNetwork
          clickable={networkSwitchingActive}
          onClick={networkSwitchingActive ? toggleNetworkSwitcherPopover : undefined}
          isConnected={!!account}
        >
          <IconWrapper size={20}>
            <img src={ChainLogo[networkConnectorChainId]} alt="chain logo" />
          </IconWrapper>
          {account && (
            <NetworkName>
              <TYPE.white ml="8px" fontWeight={700} fontSize="12px">
                {ChainLabel[networkConnectorChainId]}
              </TYPE.white>
            </NetworkName>
          )}
          {networkSwitchingActive && <TriangleIcon />}
        </Web3StatusNetwork>
      </NetworkSwitcherPopover>
    </View>
  )
}
