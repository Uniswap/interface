import { skipToken } from '@reduxjs/toolkit/dist/query'
import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { ChainId } from 'src/constants/chains'
import { useTransactionHistoryQuery } from 'src/features/dataApi/zerion/api'
import { Namespace, Transaction } from 'src/features/dataApi/zerion/types'
import { requests } from 'src/features/dataApi/zerion/utils'
import {
  addToNotificationCount,
  setLastTxNotificationUpdate,
} from 'src/features/notifications/notificationSlice'
import { selectLastTxNotificationUpdate } from 'src/features/notifications/selectors'
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
  const chainId = ChainId.Mainnet // hard coding this for now because it's the only chain Zerion supports
  const lastTxNotificationUpdate = useAppSelector(selectLastTxNotificationUpdate)

  useEffect(() => {
    if (!transactions) return
    const addresses = Object.keys(transactions)

    for (const address of addresses) {
      const transactionsForAddress = transactions[address]
      if (!transactionsForAddress?.length) continue

      const lastUpdateTime = lastTxNotificationUpdate?.[address]?.[chainId] ?? 0
      const indexOfLastSeenTx = transactionsForAddress.findIndex(
        (transaction) => transaction.mined_at === lastUpdateTime
      )
      const countOfNewTransactions =
        indexOfLastSeenTx === -1 ? transactionsForAddress.length : indexOfLastSeenTx

      if (lastUpdateTime !== transactionsForAddress[0].mined_at) {
        dispatch(
          setLastTxNotificationUpdate({
            address,
            timestamp: transactionsForAddress[0].mined_at,
            chainId,
          })
        )
      }

      if (countOfNewTransactions > 0) {
        dispatch(addToNotificationCount({ address, count: countOfNewTransactions }))
      }
    }
  }, [chainId, dispatch, lastTxNotificationUpdate, transactions])
}
