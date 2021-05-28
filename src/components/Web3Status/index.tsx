import { UnsupportedChainIdError, useWeb3React } from '@web3-react/core'
import { darken } from 'polished'
import React, { useMemo } from 'react'
import { ChevronDown } from 'react-feather'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { NetworkContextName } from '../../constants'
import useENSName from '../../hooks/useENSName'
import { useWalletModalToggle, useNetworkSwitcherPopoverToggle } from '../../state/application/hooks'
import { isTransactionRecent, useAllTransactions } from '../../state/transactions/hooks'
import { TransactionDetails } from '../../state/transactions/reducer'
import { shortenAddress } from '../../utils'
import { TYPE } from '../../theme'
import { ButtonSecondary } from '../Button'
import Loader from '../Loader'

import { RowBetween } from '../Row'
import WalletModal from '../WalletModal'
import NetworkSwitcherPopover from '../NetworkSwitcherPopover'

import EthereumLogo from '../../assets/images/ethereum-logo.png'
import XDAILogo from '../../assets/images/xdai-stake-logo.png'
import ArbitrumLogo from '../../assets/images/arbitrum-logo.jpg'
import { ChainId } from 'dxswap-sdk'
import { useActiveWeb3React } from '../../hooks'

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

const Web3StatusGeneric = styled(ButtonSecondary)`
  ${({ theme }) => theme.flexRowNoWrap}
  width: 100%;
  align-items: center;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  user-select: none;
  :focus {
    outline: none;
  }
`
const Web3StatusError = styled(Web3StatusGeneric)`
  background-color: ${({ theme }) => theme.red1};
  border: 1px solid ${({ theme }) => theme.red1};
  color: ${({ theme }) => theme.white};
  font-weight: 500;
  transition: background-color 0.3s ease;

  :hover,
  :focus {
    background-color: ${({ theme }) => darken(0.1, theme.red1)};
  }
`

const ConnectButton = styled.button`
  padding: 10.5px 14px;
  background-color: ${({ theme }) => theme.primary1};
  color: ${({ theme }) => theme.text1};
  border-radius: 12px;
  text-transform: uppercase;
  font-weight: bold;
  font-size: 12px;
  line-height: 12px;
  letter-spacing: 0.08em;
  border: none;
  cursor: pointer;
`

const AccountStatus = styled.div`
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
`

const Web3StatusNetwork = styled.button<{ pending?: boolean }>`
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

const Text = styled.p<{ fontSize?: number }>`
  flex: 1 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin: 0 0.5rem 0 0.25rem;
  font-size: 12px;
  width: fit-content;
  font-weight: 500;
  ${({ fontSize }) => (fontSize ? `font-size:${fontSize}px` : '')};
`

// we want the latest one to come first, so return negative if a is after b
function newTransactionsFirst(a: TransactionDetails, b: TransactionDetails) {
  return b.addedTime - a.addedTime
}

function Web3StatusInner() {
  const { t } = useTranslation()
  const { account, error } = useWeb3React()
  const { chainId: networkConnectorChainId } = useActiveWeb3React()

  const { ENSName } = useENSName(account ?? undefined)

  const allTransactions = useAllTransactions()

  const sortedRecentTransactions = useMemo(() => {
    const txs = Object.values(allTransactions)
    return txs.filter(isTransactionRecent).sort(newTransactionsFirst)
  }, [allTransactions])

  const pending = sortedRecentTransactions.filter(tx => !tx.receipt).map(tx => tx.hash)

  const hasPendingTransactions = !!pending.length
  const toggleWalletModal = useWalletModalToggle()
  const toggleNetworkSwitcherPopover = useNetworkSwitcherPopoverToggle()

  if (error) {
    return (
      <Web3StatusError onClick={toggleWalletModal}>
        <Text>{error instanceof UnsupportedChainIdError ? 'Wrong Network' : 'Error'}</Text>
      </Web3StatusError>
    )
  }
  if (networkConnectorChainId) {
    return (
      <>
        {!account && (
          <ConnectButton id="connect-wallet" onClick={toggleWalletModal}>
          {t('Connect wallet')}
          </ConnectButton>
        )}
        {!!account && (
          <AccountStatus>
            <Web3StatusConnected id="web3-status-connected" onClick={toggleWalletModal} pending={hasPendingTransactions}>
              {hasPendingTransactions ? (
                <RowBetween>
                  <Text fontSize={13}>{pending?.length} Pending</Text> <Loader />
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
          </AccountStatus>
        )}
      </>
    )
  }
  return null
}

export default function Web3Status() {
  const { active, account } = useWeb3React()
  const contextNetwork = useWeb3React(NetworkContextName)

  const { ENSName } = useENSName(account ?? undefined)

  const allTransactions = useAllTransactions()

  const sortedRecentTransactions = useMemo(() => {
    const txs = Object.values(allTransactions)
    return txs.filter(isTransactionRecent).sort(newTransactionsFirst)
  }, [allTransactions])

  const pending = sortedRecentTransactions.filter(tx => !tx.receipt).map(tx => tx.hash)
  const confirmed = sortedRecentTransactions.filter(tx => tx.receipt).map(tx => tx.hash)

  if (!contextNetwork.active && !active) {
    return null
  }

  return (
    <>
      <Web3StatusInner />
      <WalletModal ENSName={ENSName ?? undefined} pendingTransactions={pending} confirmedTransactions={confirmed} />
    </>
  )
}
