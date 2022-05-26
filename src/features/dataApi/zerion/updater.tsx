import { skipToken } from '@reduxjs/toolkit/dist/query'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { useTransactionHistoryQuery } from 'src/features/dataApi/zerion/api'
import { Namespace, Transaction } from 'src/features/dataApi/zerion/types'
import { requests } from 'src/features/dataApi/zerion/utils'
import { addToNotificationCount } from 'src/features/notifications/notificationSlice'
import { selectlastTxHistoryUpdate } from 'src/features/transactions/selectors'
import { setLastTxHistoryUpdate } from 'src/features/transactions/slice'
import { useAccounts } from 'src/features/wallet/hooks'

export function TransactionHistoryUpdater() {
  const accounts = useAccounts()
  const addresses = Object.keys(accounts)

  const { currentData: transactionData } = useTransactionHistoryQuery(
    addresses.length ? requests[Namespace.Address].transactions(addresses, 'subscribe') : skipToken
  )

  useProcessNewTransactions(transactionData?.info)
  return null
}

function useProcessNewTransactions(transactions?: { [address: Address]: Transaction[] | null }) {
  // TODO: look for "receive" transactions for the active account and push a notification for it
  const dispatch = useAppDispatch()
  const lastTxHistoryUpdate = useAppSelector(selectlastTxHistoryUpdate)

  if (!transactions) return

  const addresses = Object.keys(transactions)

  for (const address of addresses) {
    const transactionsForAddress = transactions[address]
    if (!transactionsForAddress?.length) continue

    const lastUpdateTime = lastTxHistoryUpdate[address]
    const countOfNewTransactions = lastUpdateTime
      ? transactionsForAddress.findIndex((transaction) => transaction.mined_at === lastUpdateTime)
      : transactionsForAddress.length

    dispatch(setLastTxHistoryUpdate({ address, timestamp: transactionsForAddress[0].mined_at }))
    dispatch(addToNotificationCount({ address, count: countOfNewTransactions }))
  }
}
