import React, { useState, useEffect, useRef } from 'react'
import styled, { keyframes, css } from 'styled-components'
import { useTranslation } from 'react-i18next'
import { useWeb3Context } from 'web3-react'
import Jazzicon from 'jazzicon'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleNotch, faArrowRight, faChevronRight, faPlusCircle, faPlus } from '@fortawesome/free-solid-svg-icons'
import { faEthereum } from '@fortawesome/free-brands-svg-icons'

import { darken } from 'polished'

import WalletModal from '../WalletModal'
import { useAllTransactions } from '../../contexts/Transactions'
import { shortenAddress } from '../../utils'
import { useENSName } from '../../hooks'

const Web3StatusWrapper = styled.button`
  ${({ theme }) => theme.flexRowNoWrap}
  width: 100%;
  font-size: 0.9rem;
  align-items: center;
  padding: 0.5rem;
  border-radius: 2rem;
  ${({ hasENS, isENS }) =>
    hasENS &&
    isENS &&
    css`
      margin-bottom: 0.75rem;
    `}

  ${({ account }) =>
    account
      ? css`
          background-color: ${({ pending, theme }) => (pending ? theme.zumthorBlue : theme.white)};
          color: ${({ pending, theme }) => (pending ? theme.royalBlue : theme.doveGray)};
          border: 1px solid ${({ pending, theme }) => (pending ? theme.royalBlue : theme.mercuryGray)};
          font-weight: 400;
          :hover {
            border: 1px solid
              ${({ pending, theme }) => (pending ? darken(0.1, theme.royalBlue) : darken(0.1, theme.mercuryGray))};
          }
        `
      : css`
          background-color: ${({ theme }) => theme.royalBlue};
          color: ${({ theme }) => theme.white};
          border: 1px solid ${({ theme }) => theme.royalBlue};
          font-weight: 500;
          font-size: 1rem;
          :hover {
            background-color: ${({ theme }) => darken(0.1, theme.royalBlue)};
          }
        `}

  box-sizing: border-box;
  cursor: pointer;
  user-select: none;
  :focus {
    outline: none;
  }
`

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`
const Spinner = styled.div`
  svg {
    animation: 2s ${rotate} linear infinite;

    path {
      color: ${({ theme }) => theme.royalBlue};
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

const Identicon = styled.div`
  height: 1rem;
  width: 1rem;
  border-radius: 1.125rem;
  background-color: ${({ theme }) => theme.silverGray};
`

const WalletIcon = styled(FontAwesomeIcon)`
  margin-left: 0.25rem;
  margin-right: 0.5rem;
`

export default function Web3Status() {
  const { t } = useTranslation()
  const { active, account, connectorName, setConnector } = useWeb3Context()

  const ENSName = useENSName(account)

  const allTransactions = useAllTransactions()
  const pending = Object.keys(allTransactions).filter(hash => !allTransactions[hash].receipt)
  const confirmed = Object.keys(allTransactions).filter(hash => allTransactions[hash].receipt)

  const hasPendingTransactions = !!pending.length

  const [walletModalIsOpen, setWalletModalIsOpen] = useState(false)
  function closeWalletModal() {
    setWalletModalIsOpen(false)
  }
  function onClick() {
    if (connectorName === 'Network' && (window.ethereum || window.web3)) {
      setConnector('Injected', { suppressAndThrowErrors: true }).catch(error => {
        setWalletModalIsOpen(true)
      })
    } else {
      setWalletModalIsOpen(true)
    }
  }

  // if the injected connector is set without an account, unset it
  useEffect(() => {
    if (connectorName === 'Injected' && !account) {
      setConnector('Network')
    }
  }, [connectorName, account, setConnector])

  const ref = useRef()
  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = ''
      if (account) {
        ref.current.appendChild(Jazzicon(16, parseInt(account.slice(2, 10), 16)))
      }
    }
  }, [account])

  return (
    active && (
      <>
        <Web3StatusWrapper onClick={onClick} pending={hasPendingTransactions} account={account}>
          <>
            {hasPendingTransactions && (
              <Spinner>
                <FontAwesomeIcon icon={faCircleNotch} />
              </Spinner>
            )}
            <Text>{account ? ENSName || shortenAddress(account) : t('Connect')}</Text>
            {account ? <Identicon ref={ref} /> : <WalletIcon icon={faEthereum} size={'sm'} />}
          </>
        </Web3StatusWrapper>
        <WalletModal
          isOpen={walletModalIsOpen}
          onDismiss={closeWalletModal}
          ENSName={ENSName}
          pendingTransactions={pending}
          confirmedTransactions={confirmed}
        />
      </>
    )
  )
}
