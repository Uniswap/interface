import React, { useState } from 'react'
import styled from 'styled-components'
import { useWeb3Context, Connectors } from 'web3-react'
import { CopyToClipboard } from 'react-copy-to-clipboard'

import Modal from '../Modal'
import { getEtherscanLink, shortenAddress, shortenTransactionHash } from '../../utils'
import { Button, Link } from '../../theme'

const { InjectedConnector } = Connectors

const Wrapper = styled.div`
  margin: 0;
  padding: 0;
  width: 100%;
  ${({ theme }) => theme.flexColumnNoWrap}
`

const UpperSection = styled.div`
  padding: 2rem;
  background-color: lightgrey;
`

const YourAccount = styled.div`
  h5 {
    margin: 0 0 1rem 0;
  }

  h4 {
    margin: 0;
  }

  h4 a {
    color: blue;
    text-decoration: none;
  }
`

const LowerSection = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap}
  padding: 2rem;
  flex-grow: 1;
  overflow: auto;

  h5 {
    margin: 0 0 1rem 0;
  }

  div {
    margin: 0 0 1rem 0;
  }

  div:last-child {
    margin: 0;
  }
`

const TransactionWrapper = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap}

  p {
    margin: 0;
  }
`

const CopyButton = styled(Button)`
  margin-left: 0.5rem;
`

function getErrorMessage(event) {
  switch (event.code) {
    case InjectedConnector.errorCodes.ETHEREUM_ACCESS_DENIED: {
      return 'Permission Required'
    }
    case InjectedConnector.errorCodes.UNLOCK_REQUIRED: {
      return 'Account Unlock Required'
    }
    case InjectedConnector.errorCodes.NO_WEB3: {
      return 'Not a Web3 Browser'
    }
    default: {
      return 'Connection Error'
    }
  }
}

export default function WalletModal({ isOpen, onDismiss, pendingTransactions, confirmedTransactions }) {
  const { account, networkId, setConnector } = useWeb3Context()

  const [activationError, setActivationError] = useState()

  function activateInjected() {
    setActivationError()
    setConnector('Injected', { suppressAndThrowErrors: true }).catch(error => {
      setActivationError(error)
    })
  }

  function renderTransactions(transactions, pending) {
    return (
      <TransactionWrapper>
        {transactions.map(transaction => {
          return (
            <p key={transaction.response.hash}>
              <Link href={getEtherscanLink(networkId, transaction.response.hash, 'transaction')}>
                {shortenTransactionHash(transaction.response.hash)} ↗ {pending ? 'pending' : 'confirmed'}
              </Link>
            </p>
          )
        })}
      </TransactionWrapper>
    )
  }

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} minHeight={null}>
      <Wrapper>
        {account ? (
          <>
            <UpperSection>
              <YourAccount>
                <h5>Your Account</h5>
                <h4>
                  <Link href={getEtherscanLink(networkId, account, 'address')}>{shortenAddress(account)} ↗ </Link>
                  <CopyToClipboard text={account}>
                    <CopyButton>Copy</CopyButton>
                  </CopyToClipboard>
                </h4>
              </YourAccount>
            </UpperSection>
            {(!!pendingTransactions.length || !!confirmedTransactions.length) && (
              <LowerSection>
                <h5>Transactions</h5>
                {renderTransactions(pendingTransactions, true)}
                {renderTransactions(confirmedTransactions, false)}
              </LowerSection>
            )}
          </>
        ) : (
          <UpperSection>
            <Button onClick={activateInjected}>Activate Browser Wallet</Button>
            {activationError ? <p>{getErrorMessage(activationError)}</p> : ''}
          </UpperSection>
        )}
      </Wrapper>
    </Modal>
  )
}
