import React, { useState } from 'react'
import styled, { css, keyframes } from 'styled-components'
import { useWeb3Context, Connectors } from 'web3-react'
import { useCopyClipboard } from '../../hooks'

import Modal from '../Modal'
import { getEtherscanLink } from '../../utils'
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
  background-color: ${({ theme }) => theme.concreteGray};
`

const YourAccount = styled.div`
  h5 {
    margin: 0 0 1rem 0;
    font-weight: 400;
    color: ${({ theme }) => theme.doveGray};
  }

  h4 {
    margin: 0;
    font-weight: 500;
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
    color: ${({ theme }) => theme.doveGray};
  }

  div:last-child {
    margin: 0;
  }
`

const AccountControl = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  min-width: 0;
  
  ${({ hasENS, isENS }) =>
    hasENS &&
    isENS &&
    css`
      margin-bottom: 0.75rem;
    `}
  font-weight: ${({ hasENS, isENS }) => (hasENS ? (isENS ? css`500` : css`400`) : css`500`)};
  font-size: ${({ hasENS, isENS }) => (hasENS ? (isENS ? css`1rem` : css`0.8rem`) : css`1rem`)};

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
  color: ${({ theme }) => theme.silverGray};
  flex-shrink: 0;
  margin-right: 1rem;
  margin-left: 0.5rem;
  text-decoration: none;
  :hover,
  :active,
  :focus {
    text-decoration: none;
    color: ${({ theme }) => theme.doveGray};
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

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`

const TransactionState = styled.div`
  background-color: ${({ pending, theme }) =>
    pending ? transparentize(0.95, theme.royalBlue) : transparentize(0.95, theme.connectedGreen)};
  border-radius: 1.5rem;
  padding: 0.5rem 0.75rem;
  font-weight: 500;
  font-size: 0.75rem;
  border: 1px solid;
  border-color: ${({ pending, theme }) =>
    pending ? transparentize(0.75, theme.royalBlue) : transparentize(0.75, theme.connectedGreen)};

  #pending {
    animation: 2s ${rotate} linear infinite;
  }
  :hover {
    border-color: ${({ pending, theme }) =>
      pending ? transparentize(0, theme.royalBlue) : transparentize(0, theme.connectedGreen)};
  }
`

const StyledLink = styled(Link)`
  color: ${({ hasENS, isENS, theme }) => (hasENS ? (isENS ? theme.royalBlue : theme.doveGray) : theme.royalBlue)};
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

const ButtonWrapper = styled.div`
  a {
    color: ${({ pending, theme }) => (pending ? theme.royalBlue : theme.connectedGreen)};
  }
`

export function Transaction({ hash, pending }) {
  const { networkId } = useWeb3Context()
  const [isCopied, copy] = useCopyClipboard()

  return (
    <TransactionWrapper key={hash}>
      <TransactionStatusWrapper>
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
        <ButtonWrapper pending={pending}>
          <Link href={getEtherscanLink(networkId, hash, 'transaction')}>
            <TransactionState pending={pending}>
              <FontAwesomeIcon id="pending" icon={faCircleNotch} />
              <TransactionStatusText>Pending</TransactionStatusText>
            </TransactionState>
          </Link>
        </ButtonWrapper>
      ) : (
        <ButtonWrapper pending={pending}>
          <Link href={getEtherscanLink(networkId, hash, 'transaction')}>
            <TransactionState pending={pending}>
              <FontAwesomeIcon icon={faCheck} />
              <TransactionStatusText>Confirmed</TransactionStatusText>
            </TransactionState>
          </Link>
        </ButtonWrapper>
      )}
    </TransactionWrapper>
  )
}

export default function WalletModal({ isOpen, onDismiss, pendingTransactions, confirmedTransactions, ENSName }) {
  const { account, networkId, setConnector } = useWeb3Context()
  const [activationError, setActivationError] = useState()
  const [isENSNameCopied, copyENSName] = useCopyClipboard()
  const [isAddressCopied, copyAddress] = useCopyClipboard()

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
                {ENSName && (
                  <AccountControl hasENS={!!ENSName} isENS={true}>
                    <StyledLink hasENS={!!ENSName} isENS={true} href={getEtherscanLink(networkId, ENSName, 'address')}>
                      {ENSName} ↗{' '}
                    </StyledLink>

                    <CopyIcon onClick={() => copyENSName(ENSName)}>
                      {isENSNameCopied ? (
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
                )}

                <AccountControl hasENS={!!ENSName} isENS={false}>
                  <StyledLink hasENS={!!ENSName} isENS={false} href={getEtherscanLink(networkId, account, 'address')}>
                    {account} ↗{' '}
                  </StyledLink>

                  <CopyIcon onClick={() => copyAddress(account)}>
                    {isAddressCopied ? (
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
