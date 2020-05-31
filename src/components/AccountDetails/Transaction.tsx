import React from 'react'
import styled from 'styled-components'
import { Check, Triangle } from 'react-feather'

import { useActiveWeb3React } from '../../hooks'
import { getEtherscanLink } from '../../utils'
import { ExternalLink, Spinner } from '../../theme'
import Circle from '../../assets/images/circle.svg'

import { transparentize } from 'polished'
import { useAllTransactions } from '../../state/transactions/hooks'

const TransactionWrapper = styled.div`
  margin-top: 0.75rem;
`

const TransactionStatusText = styled.div`
  margin-right: 0.5rem;
`

const TransactionState = styled(ExternalLink)<{ pending: boolean; success?: boolean }>`
  display: flex;
  justify-content: space-between;
  text-decoration: none !important;

  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-weight: 500;
  font-size: 0.75rem;
  border: 1px solid;

  color: ${({ pending, success, theme }) => (pending ? theme.primary1 : success ? theme.green1 : theme.red1)};

  border-color: ${({ pending, success, theme }) =>
    pending
      ? transparentize(0.75, theme.primary1)
      : success
      ? transparentize(0.75, theme.green1)
      : transparentize(0.75, theme.red1)};

  :hover {
    border-color: ${({ pending, success, theme }) =>
      pending
        ? transparentize(0, theme.primary1)
        : success
        ? transparentize(0, theme.green1)
        : transparentize(0, theme.red1)};
  }
`

const IconWrapper = styled.div`
  flex-shrink: 0;
`

export default function Transaction({ hash }: { hash: string }) {
  const { chainId } = useActiveWeb3React()
  const allTransactions = useAllTransactions()

  const summary = allTransactions?.[hash]?.summary
  const pending = !allTransactions?.[hash]?.receipt
  const success =
    !pending &&
    (allTransactions[hash].receipt.status === 1 || typeof allTransactions[hash].receipt.status === 'undefined')

  return (
    <TransactionWrapper>
      <TransactionState href={getEtherscanLink(chainId, hash, 'transaction')} pending={pending} success={success}>
        <TransactionStatusText>{summary ? summary : hash}</TransactionStatusText>
        <IconWrapper>
          {pending ? <Spinner src={Circle} /> : success ? <Check size="16" /> : <Triangle size="16" />}
        </IconWrapper>
      </TransactionState>
    </TransactionWrapper>
  )
}
