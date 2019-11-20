import React, { useEffect, useRef } from 'react'
import styled, { css } from 'styled-components'
import { useTranslation } from 'react-i18next'
import { useWeb3React } from '@web3-react/core'
import { darken, transparentize } from 'polished'
import Jazzicon from 'jazzicon'
import WalletConnectIcon from '../../assets/images/walletConnectIcon.svg'
import CoinbaseWalletIcon from '../../assets/images/coinbaseWalletIcon.svg'
import { Activity } from 'react-feather'

import { shortenAddress } from '../../utils'
import { useENSName } from '../../hooks'
import WalletModal from '../WalletModal'
import { useAllTransactions } from '../../contexts/Transactions'
import { useWalletModalContext } from '../../contexts/Wallet'
import { Spinner } from '../../theme'
import Circle from '../../assets/images/circle.svg'
import { injected, network, walletconnect, walletlink } from '../../connectors'

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
  background-color: ${({ theme }) => theme.royalBlue};
  border: 1px solid ${({ theme }) => theme.royalBlue};
  color: ${({ theme }) => theme.white};
  font-weight: 500;

  :hover,
  :focus {
    background-color: ${({ theme }) => darken(0.1, theme.royalBlue)};
  }

  ${({ faded }) =>
    faded &&
    css`
      background-color: ${({ theme }) => theme.buttonFaded};
      border: 1px solid transparent;

      :hover,
      :focus {
        background-color: ${({ theme }) => darken(0.1, theme.buttonFaded)};
      }
    `}

  }
`

const Web3StatusConnected = styled(Web3StatusGeneric)`
  background-color: ${({ pending, theme }) => (pending ? theme.zumthorBlue : theme.inputBackground)};
  border: 1px solid ${({ pending, theme }) => (pending ? theme.royalBlue : theme.mercuryGray)};
  color: ${({ pending, theme }) => (pending ? theme.royalBlue : theme.doveGray)};
  font-weight: 400;
  :hover {

    /* > P {
      color: ${({ theme }) => theme.uniswapPink};
    } */
    background-color: ${({ pending, theme }) =>
      pending ? transparentize(0.9, theme.royalBlue) : darken(0.05, theme.inputBackground)};
    
  :focus {
    border: 1px solid
      ${({ pending, theme }) => (pending ? darken(0.1, theme.royalBlue) : darken(0.1, theme.mercuryGray))};
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

const Identicon = styled.div`
  height: 1rem;
  width: 1rem;
  border-radius: 1.125rem;
  background-color: ${({ theme }) => theme.silverGray};
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
  const context = useWeb3React()
  const { connector, account, active, activate } = context

  const ENSName = useENSName(account)

  const allTransactions = useAllTransactions()
  const pending = Object.keys(allTransactions).filter(hash => !allTransactions[hash].receipt)
  const confirmed = Object.keys(allTransactions).filter(hash => allTransactions[hash].receipt)

  const hasPendingTransactions = !!pending.length

  const [{ open, setWalletError, walletError, openWalletModal, closeWalletModal }] = useWalletModalContext()
  const walletModalIsOpen = open
  const walletModalError = walletError

  function onClick() {
    if (walletModalError) {
      openWalletModal()
    } else if (connector === network && (window.ethereum || window.web3)) {
      activate(injected, undefined, true).catch(() => {
        setWalletError(true)
      })
    } else {
      openWalletModal()
    }
  }

  function getStatusIcon() {
    if (connector === network || connector === injected) {
      return <Identicon ref={ref} />
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
    }
  }

  const ref = useRef()
  useEffect(() => {
    if (connector === injected) {
      if (ref.current) {
        ref.current.innerHTML = ''
        if (account) {
          ref.current.appendChild(Jazzicon(16, parseInt(account.slice(2, 10), 16)))
        }
      }
    }
  }, [account, walletModalError, connector])

  function getWeb3Status() {
    if (walletModalError) {
      // this is ok because we're guaranteed that the error is a wrong network error
      return (
        <Web3StatusError onClick={onClick}>
          <NetworkIcon />
          <Text>Wrong Network</Text>
        </Web3StatusError>
      )
    } else if (!account) {
      return (
        <Web3StatusConnect onClick={onClick} faded={!account}>
          <Text>{t('Connect to a Wallet')}</Text>
        </Web3StatusConnect>
      )
    } else {
      return (
        <Web3StatusConnected onClick={onClick} pending={hasPendingTransactions}>
          {hasPendingTransactions && <SpinnerWrapper src={Circle} alt="loader" />}
          <Text>{ENSName || shortenAddress(account)}</Text>
          {getStatusIcon()}
        </Web3StatusConnected>
      )
    }
  }

  return (
    active && (
      <>
        {getWeb3Status()}
        <WalletModal
          isOpen={walletModalIsOpen}
          walletError={walletModalError}
          onDismiss={closeWalletModal}
          ENSName={ENSName}
          pendingTransactions={pending}
          confirmedTransactions={confirmed}
        />
      </>
    )
  )
}
