import React from 'react'
import styled, { keyframes } from 'styled-components'
import { Check } from 'react-feather'

import { useWeb3React } from '../../hooks'
import { getEtherscanLink } from '../../utils'
import { Link, Spinner } from '../../theme'
import Copy from './Copy'
import Circle from '../../assets/images/circle.svg'

import { transparentize } from 'polished'
import { useAllTransactions } from '../../contexts/Transactions'

const TransactionStatusWrapper = styled.div`
  display: flex;
  align-items: center;
  min-width: 12px;
  word-break: break-word;
`

const TransactionWrapper = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  justify-content: space-between;
  width: 100%;
  margin-top: 0.75rem;
  a {
    min-width: 0;
    word-break: break-word;
  }
`

const TransactionStatusText = styled.span`
  margin-left: 0.5rem;
  word-break: keep-all;
`

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`

const TransactionState = styled.div<{ pending?: boolean }>`
  display: flex;
  background-color: ${({ pending, theme }) =>
    pending ? transparentize(0.95, theme.primary1) : transparentize(0.95, theme.green1)};
  border-radius: 1.5rem;
  padding: 0.5rem 0.75rem;
  font-weight: 500;
  font-size: 0.75rem;
  border: 1px solid;
  border-color: ${({ pending, theme }) =>
    pending ? transparentize(0.75, theme.primary1) : transparentize(0.75, theme.green1)};

  #pending {
    animation: 2s ${rotate} linear infinite;
  }

  :hover {
    border-color: ${({ pending, theme }) =>
      pending ? transparentize(0, theme.primary1) : transparentize(0, theme.green1)};
  }
`
const ButtonWrapper = styled.div<{ pending: boolean }>`
  a {
    color: ${({ pending, theme }) => (pending ? theme.primary1 : theme.green1)};
  }
`

export default function Transaction({ hash, pending }: { hash: string; pending: boolean }) {
  const { chainId } = useWeb3React()
  const allTransactions = useAllTransactions()

  const summary = allTransactions?.[hash]?.response?.summary

  return (
    <TransactionWrapper key={hash}>
      <TransactionStatusWrapper>
        <Link href={getEtherscanLink(chainId, hash, 'transaction')}>{summary ? summary : hash} ↗ </Link>
        <Copy toCopy={hash} />
      </TransactionStatusWrapper>
      {pending ? (
        <ButtonWrapper pending={pending}>
          <Link href={getEtherscanLink(chainId, hash, 'transaction')}>
            <TransactionState pending={pending}>
              <Spinner src={Circle} id="pending" />
              <TransactionStatusText>Pending</TransactionStatusText>
            </TransactionState>
          </Link>
        </ButtonWrapper>
      ) : (
        <ButtonWrapper pending={pending}>
          <Link href={getEtherscanLink(chainId, hash, 'transaction')}>
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
