import { UnsupportedChainIdError, useWeb3React } from '@web3-react/core'
import { darken, transparentize } from 'polished'
import React, { useMemo } from 'react'
import { Activity } from 'react-feather'
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

import DropdownArrow from '../../assets/images/dropdown.svg'
import EthereumLogo from '../../assets/images/ethereum-logo.png'
import XDAILogo from '../../assets/images/xdai-stake-logo.png'
import ArbitrumLogo from '../../assets/images/arbitrum-logo.png'
import { ChainId } from 'dxswap-sdk'

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
  border-radius: 12px;
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
  :hover,
  :focus {
    background-color: ${({ theme }) => darken(0.1, theme.red1)};
  }
`

const Web3StatusConnect = styled(Web3StatusGeneric)<{ faded?: boolean }>`
  background-color: ${({ theme }) => transparentize(0.25, theme.bg1)};
  color: ${({ theme }) => theme.text4};
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 11px;
  line-height: 13px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  transition: background-color 0.3s ease;
  padding: 9px 14px;
  outline: none;

  :hover,
  :focus {
    outline: none;
    border: none;
    box-shadow: none;
    background-color: ${({ theme }) => transparentize(0.1, theme.bg1)};
  }
`

const Web3StatusConnected = styled(Web3StatusGeneric)<{ pending?: boolean }>`
  background-color: ${({ pending, theme }) => (pending ? theme.primary1 : theme.dark2)};
  border: none;
  color: ${({ pending, theme }) => (pending ? theme.white : theme.text4)};
  border-radius: 8px;
  font-weight: 700;
  font-size: 12px;
  line-height: 15px;
  letter-spacing: 0.08em;
  transition: background-color 0.3s ease;
  padding: 9px 14px;

  :hover,
  :focus {
    border: none;
    background-color: ${({ pending, theme }) => (pending ? theme.primary1 : transparentize(0.1, theme.purple3))};
  }
`

const Web3StatusNetwork = styled(Web3StatusGeneric)<{ pending?: boolean }>`
  background-color: ${({ theme }) => theme.dark1};
  margin-left 0.5em;
  padding: 3px;
  padding-left: 5px;
  border: 1px solid ${({ theme }) => theme.dark1};
`

const Text = styled.p<{ fontSize?: number }>`
  flex: 1 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin: 0 0.5rem 0 0.25rem;
  font-size: 1rem;
  width: fit-content;
  font-weight: 500;
  ${({ fontSize }) => (fontSize ? `font-size:${fontSize}px` : '')};
`

const NetworkIcon = styled(Activity)`
  margin-left: 0.25rem;
  margin-right: 0.5rem;
  width: 5px;
  height: 5px;
`

const Dropdown = styled.div`
  margin-left: 1em;
`

// we want the latest one to come first, so return negative if a is after b
function newTransactionsFirst(a: TransactionDetails, b: TransactionDetails) {
  return b.addedTime - a.addedTime
}

function Web3StatusInner() {
  const { t } = useTranslation()
  const { account, error, chainId } = useWeb3React()

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

  if (account && chainId) {
    return (
      <>
        <Web3StatusConnected id="web3-status-connected" onClick={toggleWalletModal} pending={hasPendingTransactions}>
          {hasPendingTransactions ? (
            <RowBetween>
              <Text fontSize={13}>{pending?.length} Pending</Text> <Loader />
            </RowBetween>
          ) : (
            ENSName || shortenAddress(account)
          )}
        </Web3StatusConnected>
        <Web3StatusNetwork onClick={toggleNetworkSwitcherPopover}>
          <IconWrapper size={20}>
            <img src={ChainLogo[chainId]} alt={''} />
          </IconWrapper>
          <TYPE.white ml="12px" mr="20px" fontWeight={700} fontSize="12px">
            {ChainLabel[chainId]}
          </TYPE.white>
          <Dropdown>
            <img src={DropdownArrow} alt={'dropdown.svg'} />
          </Dropdown>
        </Web3StatusNetwork>
      </>
    )
  } else if (error) {
    return (
      <Web3StatusError onClick={toggleWalletModal}>
        <NetworkIcon />
        <Text>{error instanceof UnsupportedChainIdError ? 'Wrong Network' : 'Error'}</Text>
      </Web3StatusError>
    )
  } else {
    return (
      <Web3StatusConnect id="connect-wallet" onClick={toggleWalletModal} faded={!account}>
        {t('No wallet connected')}
      </Web3StatusConnect>
    )
  }
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
      <NetworkSwitcherPopover />
    </>
  )
}
