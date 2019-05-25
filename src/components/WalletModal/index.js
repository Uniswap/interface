import React from 'react'
import styled, { css } from 'styled-components'
import { useWeb3Context } from 'web3-react'

import Transaction from './Transaction'
import Copy from './Copy'
import Modal from '../Modal'

import { getEtherscanLink } from '../../utils'
import { Link } from '../../theme'

const Wrapper = styled.div`
  margin: 0;
  padding: 0;
  width: 100%;
  ${({ theme }) => theme.flexColumnNoWrap}
`

const UpperSection = styled.div`
  padding: 2rem;
  background-color: ${({ theme }) => theme.concreteGray};

  h5 {
    margin: 0;
    margin-bottom: 0.5rem;
    font-size: 1rem;
    font-weight: 400;
  }

  h5:last-child {
    margin-bottom: 0px;
  }

  h4 {
    margin-top: 0;
    font-weight: 500;
  }
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
    margin: 0;
    font-weight: 400;
    color: ${({ theme }) => theme.doveGray};
  }

  div:last-child {
    /* margin-bottom: 0; */
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

const TransactionListWrapper = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap} /* margin: 0 0 1rem 0; */
`

const StyledLink = styled(Link)`
  color: ${({ hasENS, isENS, theme }) => (hasENS ? (isENS ? theme.royalBlue : theme.doveGray) : theme.royalBlue)};
`

// function getErrorMessage(event) {
//   switch (event.code) {
//     case InjectedConnector.errorCodes.ETHEREUM_ACCESS_DENIED: {
//       return 'Permission Required'
//     }
//     case InjectedConnector.errorCodes.UNLOCK_REQUIRED: {
//       return 'Account Unlock Required'
//     }
//     case InjectedConnector.errorCodes.NO_WEB3: {
//       return 'Not a Web3 Browser'
//     }
//     default: {
//       return 'Connection Error'
//     }
//   }
// }

export default function WalletModal({ isOpen, error, onDismiss, pendingTransactions, confirmedTransactions, ENSName }) {
  const { account, networkId } = useWeb3Context()

  function renderTransactions(transactions, pending) {
    return (
      <TransactionListWrapper>
        {transactions.map((hash, i) => {
          return <Transaction key={i} hash={hash} pending={pending} />
        })}
      </TransactionListWrapper>
    )
  }

  function wrappedOnDismiss() {
    onDismiss()
  }

  function getWalletDisplay() {
    if (error) {
      return (
        <>
          <UpperSection>
            <h4>Wrong Network</h4>
            <h5>Please connect to the main Ethereum network.</h5>
          </UpperSection>
        </>
      )
    } else if (account) {
      return (
        <>
          <UpperSection>
            <YourAccount>
              <h5>Your Account</h5>
              {ENSName && (
                <AccountControl hasENS={!!ENSName} isENS={true}>
                  <StyledLink hasENS={!!ENSName} isENS={true} href={getEtherscanLink(networkId, ENSName, 'address')}>
                    {ENSName} ↗{' '}
                  </StyledLink>

                  <Copy toCopy={ENSName} />
                </AccountControl>
              )}

              <AccountControl hasENS={!!ENSName} isENS={false}>
                <StyledLink hasENS={!!ENSName} isENS={false} href={getEtherscanLink(networkId, account, 'address')}>
                  {account} ↗{' '}
                </StyledLink>

                <Copy toCopy={account} />
              </AccountControl>
            </YourAccount>
          </UpperSection>
          {!!pendingTransactions.length || !!confirmedTransactions.length ? (
            <LowerSection>
              <h5>Recent Transactions</h5>
              {renderTransactions(pendingTransactions, true)}
              {renderTransactions(confirmedTransactions, false)}
            </LowerSection>
          ) : (
            <LowerSection>
              <h5>Your transactions will appear here...</h5>
            </LowerSection>
          )}
        </>
      )
    } else {
      return (
        <>
          <UpperSection>
            <h4>No Ethereum account found</h4>
            <h5>Please visit this page in a Web3 enabled browser.</h5>
            <h5>
              <Link href={'https://ethereum.org/use/#_3-what-is-a-wallet-and-which-one-should-i-use'}>
                Learn more ↗
              </Link>
            </h5>
          </UpperSection>
        </>
      )
    }
  }

  return (
    <Modal isOpen={isOpen} onDismiss={wrappedOnDismiss} minHeight={null}>
      <Wrapper>{getWalletDisplay()}</Wrapper>
    </Modal>
  )
}
