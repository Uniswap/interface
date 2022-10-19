import { graphql } from 'babel-plugin-relay/macro'
import { useEffect } from 'react'
import { batch } from 'react-redux'
import { useLazyLoadQuery } from 'react-relay'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { PollingInterval } from 'src/constants/misc'
import {
  setLastTxNotificationUpdate,
  setNotificationStatus,
} from 'src/features/notifications/notificationSlice'
import { selectLastTxNotificationUpdate } from 'src/features/notifications/selectors'
import { TransactionHistoryUpdaterQuery } from 'src/features/transactions/__generated__/TransactionHistoryUpdaterQuery.graphql'

// TODO(MOB-2922): replace this query with a more performant one that accepts an array of addresses
// Setting pageSize = 1 because we only need the most recent transaction
const transactionUpdaterQuery = graphql`
  query TransactionHistoryUpdaterQuery($address: String!) {
    assetActivities(address: $address, pageSize: 1, page: 1) {
      timestamp
    }
  }
`

export function TransactionHistoryUpdater({ address }: { address: Address }) {
  const dispatch = useAppDispatch()
  const lastTxNotificationUpdate = useAppSelector(selectLastTxNotificationUpdate)[address]

  const data = useLazyLoadQuery<TransactionHistoryUpdaterQuery>(
    transactionUpdaterQuery,
    {
      address,
    },
    { networkCacheConfig: { poll: PollingInterval.Fast } }
  )

  const transactionData = data?.assetActivities?.[0]

  useEffect(() => {
    if (!lastTxNotificationUpdate) {
      dispatch(setLastTxNotificationUpdate({ address, timestamp: Date.now() }))
      return
    }

    if (!transactionData) return

    const hasNewTransactions = transactionData.timestamp > lastTxNotificationUpdate
    if (hasNewTransactions) {
      batch(() => {
        dispatch(setLastTxNotificationUpdate({ address, timestamp: transactionData.timestamp }))
        dispatch(setNotificationStatus({ address, hasNotifications: true }))
      })
    }
  }, [address, dispatch, lastTxNotificationUpdate, transactionData])
  return null
}
