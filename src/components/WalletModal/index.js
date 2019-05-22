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
    color: ${props => props.theme.doveGray};
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
    font-weight: 400;
    color: ${props => props.theme.doveGray};
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
  /* justify-content: space-between; */
  align-items: center;
  min-width: 0;
  a:hover {
    text-decoration: underline;
  }
  a {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`

const TransactionWrapper = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  justify-content: space-between;
  width: 100%;
  margin: 0 0 1rem 0;
  a {
    flex: 1 1 auto;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
    max-width: 250px;
  }
`

const CopyIcon = styled(Link)`
  color: ${props => props.theme.silverGray};
  flex-shrink: 0;
  margin-right: 1rem;
  margin-left: 0.5rem;
  text-decoration: none;
  :hover {
    text-decoration: none;
    color: ${props => props.theme.doveGray};
  }
  :active {
    text-decoration: underline;
    color: ${props => props.theme.doveGray};
  }
  :focus {
    text-decoration: underline;
    color: ${props => props.theme.doveGray};
  }
`

const TransactionListWrapper = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap}
  margin: 0 0 1rem 0;
`

const TransactionStatusWrapper = styled.div`
  display: flex;
  align-items: center;
  min-width: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const TransactionStatusText = styled.span`
  margin-left: 0.25rem;
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
  background-color: ${props =>
    props.pending ? transparentize(0.95, props.theme.royalBlue) : transparentize(0.95, props.theme.connectedGreen)};
  border-radius: 1.5rem;
  padding: 0.5rem 0.75rem;
  font-weight: 500;
  font-size: 0.75rem;
  border: 1px solid;
  border-color: ${props =>
    props.pending ? transparentize(0.75, props.theme.royalBlue) : transparentize(0.75, props.theme.connectedGreen)};

  a {
    color: ${props => (props.pending ? props.theme.royalBlue : props.theme.connectedGreen)};
  }

  #pending {
    animation: 2s ${fadeIn} linear infinite;
  }
  :hover {
    border-color: ${props =>
      props.pending ? transparentize(0, props.theme.royalBlue) : transparentize(0, props.theme.connectedGreen)};
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
        {/* <Link href={getEtherscanLink(networkId, hash, 'transaction')}>{shortenTransactionHash(hash)} ↗ </Link> */}
        <Link href={getEtherscanLink(networkId, hash, 'transaction')}>{hash} ↗ </Link>

        <CopyIcon onClick={() => copy(hash)}>
          {isCopied ? (
            <TransactionStatusText>
              <FontAwesomeIcon icon={faCheckCircle} />
              <TransactionStatusText>Copied</TransactionStatusText>
            </TransactionStatusText>
          ) : (
            <TransactionStatusText>
              <FontAwesomeIcon icon={faCopy} />
            </TransactionStatusText>
          )}
        </CopyIcon>
      </TransactionStatusWrapper>
      {pending ? (
        <TransactionState pending={pending}>
          <Link href={getEtherscanLink(networkId, hash, 'transaction')}>
            <FontAwesomeIcon id="pending" icon={faCircleNotch} />
            <TransactionStatusText>Pending</TransactionStatusText>
          </Link>
        </TransactionState>
      ) : (
        <TransactionState pending={pending}>
          <Link href={getEtherscanLink(networkId, hash, 'transaction')}>
            <FontAwesomeIcon icon={faCheck} />
            <TransactionStatusText>Confirmed</TransactionStatusText>
          </Link>
        </TransactionState>
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
        {transactions.map((hash, i) => {
          return <Transaction key={i} hash={hash} pending={pending} />
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
                  {/* <Link href={getEtherscanLink(networkId, account, 'address')}>{shortenAddress(account)} ↗ </Link> */}
                  <Link href={getEtherscanLink(networkId, account, 'address')}>{account} ↗ </Link>

                  <CopyIcon onClick={() => copy(account)}>
                    {isCopied ? (
                      <TransactionStatusText>
                        <FontAwesomeIcon icon={faCheckCircle} />
                        <TransactionStatusText>Copied</TransactionStatusText>
                      </TransactionStatusText>
                    ) : (
                      <TransactionStatusText>
                        <FontAwesomeIcon icon={faCopy} />
                      </TransactionStatusText>
                    )}
                  </CopyIcon>
                </AccountControl>
              </YourAccount>
            </UpperSection>
            {(!!pendingTransactions.length || !!confirmedTransactions.length) && (
              <LowerSection>
                <h5>Recent Transactions</h5>
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
