import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import { getYear, isSameDay, isSameWeek, isSameYear } from 'date-fns'
import { useCallback, useMemo } from 'react'
import { Text } from 'rebass'
import { useAppDispatch } from 'state/hooks'
import styled from 'styled-components/macro'

import { useAllTransactions } from '../../state/transactions/hooks'
import { clearAllTransactions } from '../../state/transactions/reducer'
import { TransactionDetails } from '../../state/transactions/types'
import { TransactionSummary } from '../AccountDetailsV2'
import { SlideOutMenu } from './SlideOutMenu'

const Divider = styled.div`
  margin-top: 16px;
  border-bottom: ${({ theme }) => `1px solid ${theme.backgroundOutline}`};
`

const TransactionListWrapper = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap};
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

const renderTransactions = (transactionInformation: TransactionInformation) => {
  const { title, transactions } = transactionInformation

  return (
    <TransactionListWrapper key={title}>
      <TransactionTitle>{title}</TransactionTitle>
      {transactions.map((transactionDetails, i) => (
        <TransactionSummary key={i} transactionDetails={transactionDetails} />
      ))}
    </TransactionListWrapper>
  )
}

const getConfirmedTransactions = (confirmedTransactions: Array<TransactionDetails>) => {
  const ONE_DAY = 1000 * 60 * 60 * 24
  const THIRTY_DAYS = ONE_DAY * 30
  const NOW = new Date().getTime()

  const TODAY: Array<TransactionDetails> = []
  const CURRENT_WEEK: Array<TransactionDetails> = []
  const LAST_30_DAYS: Array<TransactionDetails> = []
  const CURRENY_YEAR: Array<TransactionDetails> = []
  const yearMap: { [key: string]: Array<TransactionDetails> } = {}

  confirmedTransactions.forEach((transaction) => {
    const { addedTime } = transaction

    if (isSameDay(NOW, addedTime)) {
      TODAY.push(transaction)
    } else if (isSameWeek(addedTime, NOW)) {
      CURRENT_WEEK.push(transaction)
    } else if (NOW - addedTime < THIRTY_DAYS) {
      LAST_30_DAYS.push(transaction)
    } else if (isSameYear(addedTime, NOW)) {
      CURRENY_YEAR.push(transaction)
    } else {
      const year = getYear(addedTime)

      if (!yearMap[year]) yearMap[year] = [transaction]
      else yearMap[year].push(transaction)
    }
  })

  const allTransactions: Array<TransactionInformation> = [
    {
      title: 'Today',
      transactions: TODAY,
    },
    {
      title: 'This week',
      transactions: CURRENT_WEEK,
    },
    {
      title: 'Past 30 Days',
      transactions: LAST_30_DAYS,
    },
    {
      title: 'This year',
      transactions: CURRENY_YEAR,
    },
  ]

  const sortedYears = Object.keys(yearMap)
    .sort((a, b) => parseInt(b) - parseInt(a))
    .map((year) => ({ title: year, transactions: yearMap[year] }))

  allTransactions.push(...sortedYears)

  return allTransactions.filter((transactionInformation) => transactionInformation.transactions.length > 0)
}

const EmptyTransaction = styled(Text)`
  text-align: center;
  margin-top: 24px;
  font-weight: 400;
  font-size: 14px;
  color: ${({ theme }) => theme.textSecondary};
`

export const TransactionHistoryMenu = ({ close }: { close: () => void }) => {
  const allTransactions = useAllTransactions()
  const { chainId } = useWeb3React()
  const dispatch = useAppDispatch()
  const allTransactionInformation = []

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

  if (pending.length) allTransactionInformation.push({ title: `Pending (${pending.length})`, transactions: pending })
  if (confirmedTransactions.length) allTransactionInformation.push(...confirmedTransactions)

  return (
    <SlideOutMenu
      close={close}
      clear={allTransactionInformation.length > 0 ? clearAllTransactionsCallback : undefined}
      title={<Trans>Transactions</Trans>}
    >
      <Divider />
      {allTransactionInformation.length > 0 ? (
        <>{allTransactionInformation.map((transactionInformation) => renderTransactions(transactionInformation))}</>
      ) : (
        <EmptyTransaction>
          <Trans>Your transactions will appear here</Trans>
        </EmptyTransaction>
      )}
    </SlideOutMenu>
  )
}
