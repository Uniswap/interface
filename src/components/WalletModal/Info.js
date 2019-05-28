import React from 'react'
import styled from 'styled-components'
import { useWeb3Context } from 'web3-react'

import { getEtherscanLink } from '../../utils'
import { Link, Spinner } from '../../theme'
import Copy from './Copy'

import { Check } from 'react-feather'
import Circle from '../../assets/images/circle.svg'

import { transparentize } from 'polished'

const TransactionStatusWrapper = styled.div`
  display: flex;
  align-items: center;
  min-width: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const TransactionWrapper = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  justify-content: space-between;
  width: 100%;
  margin-top: 0.75rem;
  a {
    /* flex: 1 1 auto; */
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
    max-width: 250px;
  }
`

const TransactionStatusText = styled.span`
  margin-left: 0.25rem;
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

  :hover {
    border-color: ${({ pending, theme }) =>
      pending ? transparentize(0, theme.royalBlue) : transparentize(0, theme.connectedGreen)};
  }
`

const ButtonWrapper = styled.div`
  a {
    color: ${({ pending, theme }) => (pending ? theme.royalBlue : theme.connectedGreen)};
  }
`

export default function Info({ hash, pending }) {
  const { networkId } = useWeb3Context()

  return (
    <TransactionWrapper key={hash}>
      <TransactionStatusWrapper>
        <Link href={getEtherscanLink(networkId, hash, 'transaction')}>{hash} ↗ </Link>
        <Copy />
      </TransactionStatusWrapper>
      {pending ? (
        <ButtonWrapper pending={pending}>
          <Link href={getEtherscanLink(networkId, hash, 'transaction')}>
            <TransactionState pending={pending}>
              <Spinner src={Circle} alt="loader" />
              <TransactionStatusText>Pending</TransactionStatusText>
            </TransactionState>
          </Link>
        </ButtonWrapper>
      ) : (
        <ButtonWrapper pending={pending}>
          <Link href={getEtherscanLink(networkId, hash, 'transaction')}>
            <TransactionState pending={pending}>
              <Check size="16" />
              <TransactionStatusText>Confirmed</TransactionStatusText>
            </TransactionState>
          </Link>
        </ButtonWrapper>
      )}
    </TransactionWrapper>
  )
}
