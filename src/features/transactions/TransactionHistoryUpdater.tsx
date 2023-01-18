import dayjs from 'dayjs'
import React, { ReactElement, useEffect, useMemo } from 'react'
import { View } from 'react-native'
import { batch } from 'react-redux'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { PollingInterval } from 'src/constants/misc'
import { useRefetchQueries } from 'src/data/hooks'
import {
  TransactionHistoryUpdaterQueryResult,
  useTransactionHistoryUpdaterQuery,
} from 'src/data/__generated__/types-and-hooks'
import {
  setLastTxNotificationUpdate,
  setNotificationStatus,
} from 'src/features/notifications/notificationSlice'
import { selectLastTxNotificationUpdate } from 'src/features/notifications/selectors'
import { useAccounts } from 'src/features/wallet/hooks'
import { ONE_SECOND_MS } from 'src/utils/time'

/**
 * For all imported accounts, checks for new transactions and updates
 * the notification status in redux.
 */
export function TransactionHistoryUpdater(): ReactElement {
  const accounts = useAccounts()
  const addresses = useMemo(() => {
    return Object.keys(accounts)
  }, [accounts])

  const { data } = useTransactionHistoryUpdaterQuery({
    variables: { addresses },
    pollInterval: PollingInterval.Fast,
  })

  return (
    <>
      {data?.portfolios?.map((portfolio) => {
        if (!portfolio?.ownerAddress || !portfolio?.assetActivities) return null

        return (
          <View
            key={portfolio.ownerAddress}
            testID={`AddressTransactionHistoryUpdater/${portfolio.ownerAddress}`}>
            <AddressTransactionHistoryUpdater
              activities={portfolio.assetActivities}
              address={portfolio.ownerAddress}
            />
          </View>
        )
      }) ?? null}
    </>
  )
}

function AddressTransactionHistoryUpdater({
  address,
  activities,
}: {
  address: string
  activities: NonNullable<
    NonNullable<
      NonNullable<NonNullable<TransactionHistoryUpdaterQueryResult['data']>['portfolios']>[0]
    >['assetActivities']
  >
}): ReactElement | null {
  const dispatch = useAppDispatch()

  // Current txn count for all addresses
  const lastTxNotificationUpdateTimestamp = useAppSelector(selectLastTxNotificationUpdate)[address]

  const refetchQueries = useRefetchQueries()

  useEffect(() => {
    batch(() => {
      let shouldRefetchQueries = false

      // parse txns and address from portfolio
      activities.map((activity) => {
        if (!activity) return

        if (!lastTxNotificationUpdateTimestamp) {
          dispatch(setLastTxNotificationUpdate({ address, timestamp: dayjs().valueOf() })) // Note this is in ms
          return
        }

        const updatedTimestampMs = activity.timestamp * ONE_SECOND_MS // convert api response from s -> ms
        const hasNewTransactions = updatedTimestampMs > lastTxNotificationUpdateTimestamp

        if (hasNewTransactions) {
          dispatch(setLastTxNotificationUpdate({ address, timestamp: updatedTimestampMs }))
          dispatch(setNotificationStatus({ address, hasNotifications: true }))
          // full send refetch all active (mounted) queries
          shouldRefetchQueries = true
        }
      })

      if (shouldRefetchQueries) {
        // NOTE: every wallet may call this on new transaction.
        // It may be better to batch this action, or target specific queries.
        refetchQueries()
      }
    })
  }, [activities, address, dispatch, lastTxNotificationUpdateTimestamp, refetchQueries])

  return null
}
