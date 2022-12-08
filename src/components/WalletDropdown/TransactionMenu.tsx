import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import { getYear, isSameDay, isSameWeek, isSameYear } from 'date-fns'
import ms from 'ms.macro'
import { useCallback, useMemo } from 'react'
import { useAppDispatch } from 'state/hooks'
import styled from 'styled-components/macro'
import { flexColumnNoWrap } from 'theme/styles'

import { useAllTransactions } from '../../state/transactions/hooks'
import { clearAllTransactions } from '../../state/transactions/reducer'
import { TransactionDetails } from '../../state/transactions/types'
import { TransactionSummary } from '../AccountDetailsV2'
import { SlideOutMenu } from './SlideOutMenu'

const THIRTY_DAYS = ms`30 days`

const Divider = styled.div`
  margin-top: 16px;
  border-bottom: ${({ theme }) => `1px solid ${theme.backgroundOutline}`};
`

const TransactionListWrapper = styled.div`
  ${flexColumnNoWrap};
`

interface TransactionInformation {
  title: string
  transactions: TransactionDetails[]
}

const TransactionTitle = styled.span`
  padding-bottom: 8px;
  padding-top: 20px;
  padding-left: 12px;
  padding-right: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.textTertiary};
`

const TransactionList = ({ transactionInformation }: { transactionInformation: TransactionInformation }) => {
  const { title, transactions } = transactionInformation

  return (
    <TransactionListWrapper key={title}>
      <TransactionTitle>{title}</TransactionTitle>
      {transactions.map((transactionDetails, index) => (
        <TransactionSummary
          key={transactionDetails.hash}
          transactionDetails={transactionDetails}
          isLastTransactionInList={index === transactions.length - 1}
        />
      ))}
    </TransactionListWrapper>
  )
}

const getConfirmedTransactions = (confirmedTransactions: Array<TransactionDetails>) => {
  const now = new Date().getTime()

  const today: Array<TransactionDetails> = []
  const currentWeek: Array<TransactionDetails> = []
  const last30Days: Array<TransactionDetails> = []
  const currentYear: Array<TransactionDetails> = []
  const yearMap: { [key: string]: Array<TransactionDetails> } = {}

  confirmedTransactions.forEach((transaction) => {
    const { addedTime } = transaction

    if (isSameDay(now, addedTime)) {
      today.push(transaction)
    } else if (isSameWeek(addedTime, now)) {
      currentWeek.push(transaction)
    } else if (now - addedTime < THIRTY_DAYS) {
      last30Days.push(transaction)
    } else if (isSameYear(addedTime, now)) {
      currentYear.push(transaction)
    } else {
      const year = getYear(addedTime)

      if (!yearMap[year]) {
        yearMap[year] = [transaction]
      } else {
        yearMap[year].push(transaction)
      }
    }
  })

  const transactionGroups: Array<TransactionInformation> = [
    {
      title: 'Today',
      transactions: today,
    },
    {
      title: 'This week',
      transactions: currentWeek,
    },
    {
      title: 'Past 30 Days',
      transactions: last30Days,
    },
    {
      title: 'This year',
      transactions: currentYear,
    },
  ]

  const sortedYears = Object.keys(yearMap)
    .sort((a, b) => parseInt(b) - parseInt(a))
    .map((year) => ({ title: year, transactions: yearMap[year] }))

  transactionGroups.push(...sortedYears)

  return transactionGroups.filter((transactionInformation) => transactionInformation.transactions.length > 0)
}

const EmptyTransaction = styled.div`
  text-align: center;
  margin-top: 24px;
  font-weight: 400;
  font-size: 14px;
  padding-left: 12px;
  padding-right: 12px;
  color: ${({ theme }) => theme.textSecondary};
`

export const TransactionHistoryMenu = ({ onClose }: { onClose: () => void }) => {
  const allTransactions = useAllTransactions()
  const { chainId } = useWeb3React()
  const dispatch = useAppDispatch()
  const transactionGroupsInformation = []

  const clearAllTransactionsCallback = useCallback(() => {
    if (chainId) dispatch(clearAllTransactions({ chainId }))
  }, [dispatch, chainId])

  const [confirmed, pending] = useMemo(() => {
    const confirmed: Array<TransactionDetails> = []
    const pending: Array<TransactionDetails> = []

    const sorted = Object.values(allTransactions).sort((a, b) => b.addedTime - a.addedTime)
    sorted.forEach((transaction) => (transaction.receipt ? confirmed.push(transaction) : pending.push(transaction)))

    return [confirmed, pending]
  }, [allTransactions])

  const confirmedTransactions = useMemo(() => getConfirmedTransactions(confirmed), [confirmed])

  if (pending.length) transactionGroupsInformation.push({ title: `Pending (${pending.length})`, transactions: pending })
  if (confirmedTransactions.length) transactionGroupsInformation.push(...confirmedTransactions)

  return (
    <SlideOutMenu
      onClose={onClose}
      onClear={transactionGroupsInformation.length > 0 ? clearAllTransactionsCallback : undefined}
      title={<Trans>Transactions</Trans>}
    >
      <Divider />
      {transactionGroupsInformation.length > 0 ? (
        <>
          {transactionGroupsInformation.map((transactionInformation) => (
            <TransactionList key={transactionInformation.title} transactionInformation={transactionInformation} />
          ))}
        </>
      ) : (
        <EmptyTransaction data-testid="wallet-empty-transaction-text">
          <Trans>Your transactions will appear here</Trans>
        </EmptyTransaction>
      )}
    </SlideOutMenu>
  )
}
