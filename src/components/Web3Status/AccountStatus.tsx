import { ChainId } from 'dxswap-sdk';
import React from 'react'
import { ChevronDown } from 'react-feather';
import { Text } from 'rebass';
import styled from 'styled-components';
import { useNetworkSwitcherPopoverToggle } from '../../state/application/hooks';
import { TYPE } from '../../theme';
import { shortenAddress } from '../../utils';
import Loader from '../Loader';
import NetworkSwitcherPopover from '../NetworkSwitcherPopover';
import { RowBetween } from '../Row';
import EthereumLogo from '../../assets/images/ethereum-logo.png'
import XDAILogo from '../../assets/images/xdai-stake-logo.png'
import ArbitrumLogo from '../../assets/images/arbitrum-logo.jpg'

const ChainLogo: any = {
  [ChainId.MAINNET]: EthereumLogo,
  [ChainId.RINKEBY]: EthereumLogo,
  [ChainId.ARBITRUM_TESTNET_V3]: ArbitrumLogo,
  [ChainId.SOKOL]: '',
  [ChainId.XDAI]: XDAILogo
}

const ChainLabel: any = {
  [ChainId.MAINNET]: 'Ethereum',
  [ChainId.RINKEBY]: 'Rinkeby',
  [ChainId.ARBITRUM_TESTNET_V3]: 'Arbitrum',
  [ChainId.SOKOL]: 'Sokol',
  [ChainId.XDAI]: 'xDai'
}

const View = styled.div`
  display: flex;
  align-items: center;
  background-color: ${({ theme }) => theme.dark1};
  border: solid 2px transparent;
  color: ${({ theme }) => theme.purple2};
  border-radius: 12px;
  white-space: nowrap;
`;

const Web3StatusConnected = styled.button<{ pending?: boolean }>`
  height: 29px;
  padding: 0 0 0 8px;
  background: none;
  border: none;
  color: ${({ pending, theme }) => (pending ? theme.white : theme.text4)};
  font-weight: 700;
  font-size: 11px;
  line-height: 13px;
  letter-spacing: 0.08em;
  cursor: pointer;
`;

const Web3StatusNetwork = styled.button<{ pendingTransactions?: boolean }>`
  display: flex;
  align-items: center;
  height: 29px;
  padding: 7px 8px;
  margin-left: 10px;
  font-size: 12px;
  line-height: 15px;
  text-align: center;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #FFFFFF;
  border-radius: 12px;
  background-color: ${({ theme }) => theme.dark2};
  border: none;
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

interface AccountStatusProps {
  pendingTransactions: string[];
  ENSName?: string;
  account: string;
  networkConnectorChainId: ChainId;
  onAddressClick: () => void;
}

export function AccountStatus({pendingTransactions, ENSName, account, networkConnectorChainId, onAddressClick}: AccountStatusProps) {
  const hasPendingTransactions = !!pendingTransactions.length
  const toggleNetworkSwitcherPopover = useNetworkSwitcherPopoverToggle()
  
  return (
    <View>
      <Web3StatusConnected id="web3-status-connected" onClick={onAddressClick} pending={hasPendingTransactions}>
        {hasPendingTransactions ? (
          <RowBetween>
            <Text fontSize={13}>{pendingTransactions?.length} Pending</Text> <Loader />
          </RowBetween>
        ) : (
          ENSName || shortenAddress(account)
        )}
      </Web3StatusConnected>
      <NetworkSwitcherPopover>
        <Web3StatusNetwork onClick={!!!account ? toggleNetworkSwitcherPopover : () => {}}>
          <IconWrapper size={20}>
            <img src={ChainLogo[networkConnectorChainId]} alt={''} />
          </IconWrapper>
          <TYPE.white ml="8px" mr={!!!account ? '4px' : '0px'} fontWeight={700} fontSize="12px">
            {ChainLabel[networkConnectorChainId]}
          </TYPE.white>
          {!!!account && <ChevronDown size={16} />}
        </Web3StatusNetwork>
      </NetworkSwitcherPopover>
    </View>
  )
}
