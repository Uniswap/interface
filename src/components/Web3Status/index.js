import React from 'react'
import styled, { css } from 'styled-components'
import { useTranslation } from 'react-i18next'
import { useWeb3React, UnsupportedChainIdError } from '@web3-react/core'
import { darken, transparentize } from 'polished'
import { Activity } from 'react-feather'

import { shortenAddress } from '../../utils'
import { useENSName } from '../../hooks'
import WalletModal from '../WalletModal'
import { useAllTransactions } from '../../contexts/Transactions'
import { useWalletModalToggle } from '../../contexts/Application'
import { Spinner } from '../../theme'
import Circle from '../../assets/images/circle.svg'
import { injected, walletconnect, walletlink, fortmatic, portis } from '../../connectors'
import WalletConnectIcon from '../../assets/images/walletConnectIcon.svg'
import CoinbaseWalletIcon from '../../assets/images/coinbaseWalletIcon.svg'
import FortmaticIcon from '../../assets/images/fortmaticIcon.png'
import PortisIcon from '../../assets/images/portisIcon.png'
import { NetworkContextName } from '../../constants'
import Identicon from '../Identicon'

const Web3StatusGeneric = styled.button`
  ${({ theme }) => theme.flexRowNoWrap}
  width: 100%;
  font-size: 0.9rem;
  align-items: center;
  padding: 0.5rem;
  border-radius: 2rem;
  box-sizing: border-box;
  cursor: pointer;
  user-select: none;
  :focus {
    outline: none;
  }
`
const Web3StatusError = styled(Web3StatusGeneric)`
  background-color: ${({ theme }) => theme.salmonRed};
  border: 1px solid ${({ theme }) => theme.salmonRed};
  color: ${({ theme }) => theme.white};
  font-weight: 500;
  :hover,
  :focus {
    background-color: ${({ theme }) => darken(0.1, theme.salmonRed)};
  }
`

const Web3StatusConnect = styled(Web3StatusGeneric)`
  background-color: transparent;
  border: 1px solid ${({ theme }) => theme.royalBlue};
  color: ${({ theme }) => theme.royalBlue};
  font-weight: 500;

  :hover,
  :focus {
    border: 1px solid ${({ theme }) => darken(0.1, theme.royalBlue)};
    color: ${({ theme }) => darken(0.1, theme.royalBlue)};
  }

  ${({ faded }) =>
    faded &&
    css`
      background-color: transparent;
      border: 1px solid ${({ theme }) => theme.royalBlue};
      color: ${({ theme }) => theme.royalBlue};

      :hover,
      :focus {
        border: 1px solid ${({ theme }) => darken(0.1, theme.royalBlue)};
        color: ${({ theme }) => darken(0.1, theme.royalBlue)};
      }
    `}
`

const Web3StatusConnected = styled(Web3StatusGeneric)`
  background-color: ${({ pending, theme }) => (pending ? theme.zumthorBlue : theme.inputBackground)};
  border: 1px solid ${({ pending, theme }) => (pending ? theme.royalBlue : theme.mercuryGray)};
  color: ${({ pending, theme }) => (pending ? theme.royalBlue : theme.doveGray)};
  font-weight: 400;
  :hover {
    background-color: ${({ pending, theme }) =>
      pending ? transparentize(0.9, theme.royalBlue) : darken(0.05, theme.inputBackground)};

    :focus {
      border: 1px solid
        ${({ pending, theme }) => (pending ? darken(0.1, theme.royalBlue) : darken(0.1, theme.mercuryGray))};
    }
  }
`

const Text = styled.p`
  flex: 1 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin: 0 0.5rem 0 0.25rem;
  font-size: 0.83rem;
`

const NetworkIcon = styled(Activity)`
  margin-left: 0.25rem;
  margin-right: 0.5rem;
  width: 16px;
  height: 16px;
`

const SpinnerWrapper = styled(Spinner)`
  margin: 0 0.25rem 0 0.25rem;
`

const IconWrapper = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap};
  align-items: center;
  justify-content: center;
  & > * {
    height: ${({ size }) => (size ? size + 'px' : '32px')};
    width: ${({ size }) => (size ? size + 'px' : '32px')};
  }
`

export default function Web3Status() {
  const { t } = useTranslation()
  const { active, account, connector, error } = useWeb3React()
  const contextNetwork = useWeb3React(NetworkContextName)

  const ENSName = useENSName(account)

  const allTransactions = useAllTransactions()
  const pending = Object.keys(allTransactions).filter(hash => !allTransactions[hash].receipt)
  const confirmed = Object.keys(allTransactions).filter(hash => allTransactions[hash].receipt)

  const hasPendingTransactions = !!pending.length

  const toggleWalletModal = useWalletModalToggle()

  // handle the logo we want to show with the account
  function getStatusIcon() {
    if (connector === injected) {
      return <Identicon />
    } else if (connector === walletconnect) {
      return (
        <IconWrapper size={16}>
          <img src={WalletConnectIcon} alt={''} />
        </IconWrapper>
      )
    } else if (connector === walletlink) {
      return (
        <IconWrapper size={16}>
          <img src={CoinbaseWalletIcon} alt={''} />
        </IconWrapper>
      )
    } else if (connector === fortmatic) {
      return (
        <IconWrapper size={16}>
          <img src={FortmaticIcon} alt={''} />
        </IconWrapper>
      )
    } else if (connector === portis) {
      return (
        <IconWrapper size={16}>
          <img src={PortisIcon} alt={''} />
        </IconWrapper>
      )
    }
  }

  function getWeb3Status() {
    if (account) {
      return (
        <Web3StatusConnected onClick={toggleWalletModal} pending={hasPendingTransactions}>
          {hasPendingTransactions && <SpinnerWrapper src={Circle} alt="loader" />}
          <Text>{ENSName || shortenAddress(account)}</Text>
          {getStatusIcon()}
        </Web3StatusConnected>
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
        <Web3StatusConnect onClick={toggleWalletModal} faded={!account}>
          <Text>{t('Connect to a Wallet')}</Text>
        </Web3StatusConnect>
      )
    }
  }

  if (!contextNetwork.active && !active) {
    return null
  }

  return (
    <>
      {getWeb3Status()}
      <WalletModal ENSName={ENSName} pendingTransactions={pending} confirmedTransactions={confirmed} />
    </>
  )
}
