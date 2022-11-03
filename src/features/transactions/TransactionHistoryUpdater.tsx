import { graphql } from 'babel-plugin-relay/macro'
import { useEffect } from 'react'
import { batch } from 'react-redux'
import { PreloadedQuery, usePreloadedQuery } from 'react-relay'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { refetchAllQueries } from 'src/data/apollo'
import {
  setLastTxNotificationUpdate,
  setNotificationStatus,
} from 'src/features/notifications/notificationSlice'
import { selectLastTxNotificationUpdate } from 'src/features/notifications/selectors'
import { TransactionHistoryUpdaterQuery } from 'src/features/transactions/__generated__/TransactionHistoryUpdaterQuery.graphql'
import { useAccounts } from 'src/features/wallet/hooks'

export const transactionUpdaterQuery = graphql`
  query TransactionHistoryUpdaterQuery($ownerAddresses: [String!]!) {
    portfolios(ownerAddresses: $ownerAddresses) {
      ownerAddress
      assetActivities(pageSize: 1, page: 1) {
        timestamp
      }
    }
  }
`

export function TransactionHistoryUpdater({
  transactionHistoryUpdaterQueryRef,
}: {
  transactionHistoryUpdaterQueryRef: PreloadedQuery<TransactionHistoryUpdaterQuery>
}) {
  const dispatch = useAppDispatch()
  const accounts = useAccounts()
  const addresses = Object.keys(accounts)

  // Current txn count for all addresses
  const lastTxNotificationUpdatesByAddress = useAppSelector(selectLastTxNotificationUpdate)

  // Txn count from api for all addresses
  const portfoliosData = usePreloadedQuery(
    transactionUpdaterQuery,
    transactionHistoryUpdaterQueryRef
  )

  useEffect(() => {
    batch(() => {
      portfoliosData.portfolios?.map((portfolio) => {
        // parse txns and address from portfolio
        const transactionData = portfolio?.assetActivities?.[0]
        const address = portfolio?.ownerAddress

        if (!address) {
          return
        }

        const lastTxNotificationUpdateTimestamp = address
          ? lastTxNotificationUpdatesByAddress[address]
          : undefined

        if (!lastTxNotificationUpdateTimestamp) {
          dispatch(
            // Timestamp from api is in seconds, convert to seconds for correct comparison.
            setLastTxNotificationUpdate({ address, timestamp: Math.round(Date.now() / 1000) })
          )
          return
        }

        if (!transactionData) return

        const hasNewTransactions = transactionData.timestamp > lastTxNotificationUpdateTimestamp

        if (hasNewTransactions) {
          dispatch(setLastTxNotificationUpdate({ address, timestamp: transactionData.timestamp }))
          dispatch(setNotificationStatus({ address, hasNotifications: true }))

          // full send refetch all active (mounted) queries
          refetchAllQueries()
        }
      })
    })
  }, [addresses, dispatch, lastTxNotificationUpdatesByAddress, portfoliosData.portfolios])

  return null
}
