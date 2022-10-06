import { graphql } from 'babel-plugin-relay/macro'
import { useEffect } from 'react'
import { batch } from 'react-redux'
import { useLazyLoadQuery } from 'react-relay'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import {
  addToNotificationCount,
  setLastTxNotificationUpdate,
} from 'src/features/notifications/notificationSlice'
import { selectLastTxNotificationUpdate } from 'src/features/notifications/selectors'
import { TransactionHistoryUpdaterQuery } from 'src/features/transactions/__generated__/TransactionHistoryUpdaterQuery.graphql'

// TODO: replace this query with a more performant one that accepts an array of addresses
// Setting pageSize = 100 because "99+" is the largest badge count we display
const transactionUpdaterQuery = graphql`
  query TransactionHistoryUpdaterQuery($address: String!) {
    assetActivities(address: $address, pageSize: 100, page: 1) {
      timestamp
    }
  }
`

export function TransactionHistoryUpdater({ address }: { address: Address }) {
  const dispatch = useAppDispatch()
  const lastTxNotificationUpdate: number | undefined =
    useAppSelector(selectLastTxNotificationUpdate)[address] ?? 0

  const data = useLazyLoadQuery<TransactionHistoryUpdaterQuery>(transactionUpdaterQuery, {
    address,
  })

  const transactionData = data?.assetActivities

  useEffect(() => {
    if (!transactionData?.length) return

    const { lastUpdatedTime, newTxCount } = transactionData.reduce(
      (acc, transaction) => {
        const timestamp = transaction?.timestamp
        if (!timestamp) return acc
        if (timestamp > lastTxNotificationUpdate) acc.newTxCount += 1
        if (timestamp > acc.lastUpdatedTime) acc.lastUpdatedTime = timestamp
        return acc
      },
      { lastUpdatedTime: lastTxNotificationUpdate, newTxCount: 0 }
    )

    if (newTxCount) {
      batch(() => {
        dispatch(setLastTxNotificationUpdate({ address, timestamp: lastUpdatedTime }))
        dispatch(addToNotificationCount({ address, count: newTxCount }))
      })
    }
  }, [address, dispatch, lastTxNotificationUpdate, transactionData])
  return null
}
