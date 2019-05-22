import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import { useWeb3Context } from 'web3-react'
import Jazzicon from 'jazzicon'

import WalletModal from '../WalletModal'
import { ReactComponent as _Spinner } from '../../assets/images/spinner.svg'
import { useAllTransactions } from '../../contexts/Transactions'
import { shortenAddress } from '../../utils'

const Web3StatusWrapper = styled.button`
  ${({ theme }) => theme.flexRowNoWrap}
  font-size: 0.9rem;
  align-items: center;
  padding: 0.5rem;
  border-radius: 2rem;
  background-color: ${({ pending, theme }) => (pending ? theme.zumthorBlue : theme.white)};
  border: 1px solid ${({ pending, theme }) => (pending ? theme.royalBlue : theme.mercuryGray)};
  color: ${({ pending, theme }) => (pending ? theme.royalBlue : theme.doveGray)};
  font-weight: 400;
  box-sizing: border-box;
  cursor: pointer;
  user-select: none;
`

const Spinner = styled(_Spinner)`
  height: 100%;
  width: 1rem;
  stroke: ${({ theme }) => theme.royalBlue};
`

const Text = styled.p`
  flex: 1 1 auto;
  overflow: hidden;
  margin: 0 0.5rem 0 0.25rem;
  font-size: 0.75rem;
`

const Identicon = styled.div`
  height: 1rem;
  width: 1rem;
  border-radius: 1.125rem;
  background-color: ${({ theme }) => theme.silverGray};
`

const dummyTransactions = [
  '0x7e2135f689969c0dad026a71e52715bcd915cd9c2542f4cd54bb4530d29850a5',
  '0x7e2135f689969c0dad026a71e52715bcd915cd9c2542f4cd54bb4530d29850a5',
  '0x7e2135f689969c0dad026a71e52715bcd915cd9c2542f4cd54bb4530d29850a5',
  '0x7e2135f689969c0dad026a71e52715bcd915cd9c2542f4cd54bb4530d29850a5'
]

export default function Web3Status() {
  const { t } = useTranslation()
  const { active, account, connectorName, setConnector } = useWeb3Context()

  const allTransactions = useAllTransactions()
  // const pending = Object.keys(allTransactions).filter(hash => !allTransactions[hash].receipt)
  // const confirmed = Object.keys(allTransactions).filter(hash => allTransactions[hash].receipt)

  const pending = dummyTransactions
  const confirmed = dummyTransactions

  const hasPendingTransactions = !!pending.length

  // const [walletModalIsOpen, setWalletModalIsOpen] = useState(false)
  const [walletModalIsOpen, setWalletModalIsOpen] = useState(true)
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
        <Web3StatusWrapper onClick={onClick} pending={hasPendingTransactions}>
          {hasPendingTransactions ? (
            <>
              <Spinner />
              <Text>{t('pending')}</Text>
            </>
          ) : (
            <Text>{account ? shortenAddress(account) : t('disconnected')}</Text>
          )}
          <Identicon ref={ref} />
        </Web3StatusWrapper>
        <WalletModal
          isOpen={walletModalIsOpen}
          onDismiss={closeWalletModal}
          pendingTransactions={pending}
          confirmedTransactions={confirmed}
        />
      </>
    )
  )
}
