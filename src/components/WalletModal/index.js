import React, { useState } from 'react'
import styled, { keyframes } from 'styled-components'
import { useWeb3Context, Connectors } from 'web3-react'
import { useCopyClipboard } from '../../hooks'

import Modal from '../Modal'
import { getEtherscanLink, shortenAddress, shortenTransactionHash } from '../../utils'
import { Button, Link } from '../../theme'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCopy, faCheckCircle } from '@fortawesome/free-regular-svg-icons'
import { faCircleNotch, faCheck } from '@fortawesome/free-solid-svg-icons'

import { transparentize } from 'polished'

const { InjectedConnector } = Connectors

const Wrapper = styled.div`
  margin: 0;
  padding: 0;
  width: 100%;
  ${({ theme }) => theme.flexColumnNoWrap}
`

const UpperSection = styled.div`
  padding: 2rem;
  background-color: ${props => props.theme.concreteGray};
`

const YourAccount = styled.div`
  h5 {
    margin: 0 0 1rem 0;
    font-weight: 400;
  }

  h4 {
    margin: 0;
    font-weight: 500;
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
    /* margin: 0 0 1rem 0; */
  }

  div:last-child {
    margin: 0;
  }
`

const AccountControl = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  justify-content: space-between;
  align-items: center;
`

const TransactionWrapper = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  justify-content: space-between;
  width: 100%;
  margin: 0 0 1rem 0;
`

const TransactionListWrapper = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap}
  margin: 0 0 1rem 0;
`

const TransactionStatusWrapper = styled.div`
  ${({ theme }) => theme.flexRowNoWrap} /* width: 100%; */
  align-items: center;
`

const fadeIn = keyframes`
  from{
        transform: rotate(0deg);
    }
    to{
        transform: rotate(360deg);
    }
`

const TransactionState = styled.div`
  color: ${props => (props.pending ? props.theme.royalBlue : props.theme.connectedGreen)};
  background-color: ${props =>
    props.pending ? transparentize(0.95, props.theme.royalBlue) : transparentize(0.95, props.theme.connectedGreen)};
  border-radius: 1.5rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid;
  border-color: ${props =>
    props.pending ? transparentize(0.75, props.theme.royalBlue) : transparentize(0.75, props.theme.connectedGreen)};

  #pending {
    animation: 2s ${fadeIn} linear infinite;
  }
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

export function Transaction({ hash, pending }) {
  const { networkId } = useWeb3Context()
  const [isCopied, copy] = useCopyClipboard()

  return (
    <TransactionWrapper key={hash}>
      <TransactionStatusWrapper>
        <Link href={getEtherscanLink(networkId, hash, 'transaction')}>{shortenTransactionHash(hash)} ↗ </Link>
        <Link onClick={() => copy(hash)}>
          {isCopied ? (
            <span>
              &nbsp;&nbsp;
              <FontAwesomeIcon icon={faCheckCircle} />
              &nbsp;Copied
            </span>
          ) : (
            <span>
              &nbsp;&nbsp;
              <FontAwesomeIcon icon={faCopy} />
            </span>
          )}
        </Link>
      </TransactionStatusWrapper>
      {pending ? (
        <Link href={getEtherscanLink(networkId, hash, 'transaction')}>
          <TransactionState pending={pending}>
            <FontAwesomeIcon id="pending" icon={faCircleNotch} />
            &nbsp;&nbsp;Pending
          </TransactionState>
        </Link>
      ) : (
        <Link href={getEtherscanLink(networkId, hash, 'transaction')}>
          <TransactionState pending={pending}>
            <FontAwesomeIcon icon={faCheck} /> &nbsp;Confirmed
          </TransactionState>
        </Link>
      )}
    </TransactionWrapper>
  )
}

export default function WalletModal({ isOpen, onDismiss, pendingTransactions, confirmedTransactions }) {
  const { account, networkId, setConnector } = useWeb3Context()
  const [activationError, setActivationError] = useState()
  const [isCopied, copy] = useCopyClipboard()

  function activateInjected() {
    setActivationError()
    setConnector('Injected', { suppressAndThrowErrors: true }).catch(error => {
      setActivationError(error)
    })
  }

  function renderTransactions(transactions, pending) {
    return (
      <TransactionListWrapper>
        {transactions.map(hash => {
          return <Transaction hash={hash} pending={pending} />
        })}
      </TransactionListWrapper>
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
                <AccountControl>
                  <Link href={getEtherscanLink(networkId, account, 'address')}>{shortenAddress(account)} ↗ </Link>
                  <Link onClick={() => copy(account)}>
                    {isCopied ? (
                      <span>
                        <FontAwesomeIcon icon={faCheckCircle} />
                        &nbsp;Copied
                      </span>
                    ) : (
                      <FontAwesomeIcon icon={faCopy} />
                    )}
                  </Link>
                </AccountControl>
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
