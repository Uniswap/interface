import useInterval from 'lib/hooks/useInterval'
import ms from 'ms'
import { useEffect } from 'react'
import { useFiatOnRampTransactions } from 'state/fiatOnRampTransactions/hooks'
import { removeFiatOnRampTransaction, updateFiatOnRampTransaction } from 'state/fiatOnRampTransactions/reducer'
import { FiatOnRampTransactionStatus, backendStatusToFiatOnRampStatus } from 'state/fiatOnRampTransactions/types'
import { useAppDispatch } from 'state/hooks'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { useActivityWebLazyQuery } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { FOR_API_HEADERS } from 'uniswap/src/features/fiatOnRamp/constants'
import { FORTransactionRequest } from 'uniswap/src/features/fiatOnRamp/types'
import { FiatOnRampEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { logger } from 'utilities/src/logger/logger'

export default function Updater(): null {
  const fiatOnRampTransactions = useFiatOnRampTransactions()
  const dispatch = useAppDispatch()
  const [, query] = useActivityWebLazyQuery()

  // Polls the fiat on-ramp API for new FOR transactions, until Meld returns a valid result for each.
  // Once we find this initial record for a transaction, we start polling the GQL ActivityWeb endpoint
  // to find it and include it in the assetActivities result.
  // See the useInterval hook in AssetActivityProvider for the polling logic.
  useInterval(() => {
    Object.values(fiatOnRampTransactions).forEach(async (transaction) => {
      if (!transaction.forceFetched) {
        const requestParams: FORTransactionRequest = {
          sessionId: transaction.externalSessionId,
          forceFetch: true,
        }
        const result = await fetch(`${uniswapUrls.forApiUrl}/Transaction`, {
          headers: FOR_API_HEADERS,
          method: 'POST',
          body: JSON.stringify(requestParams),
        })
        const data = await result.json()
        if (data?.transaction) {
          dispatch(updateFiatOnRampTransaction({ ...transaction, forceFetched: true }))
          sendAnalyticsEvent(FiatOnRampEventName.FiatOnRampTransactionUpdated, {
            status: FiatOnRampTransactionStatus.PENDING,
            externalTransactionId: transaction.externalSessionId,
            serviceProvider: transaction.provider,
          })
        } else if (Date.now() - transaction.addedAt > ms('10m')) {
          dispatch(removeFiatOnRampTransaction(transaction))
          sendAnalyticsEvent(FiatOnRampEventName.FiatOnRampTransactionUpdated, {
            status: FiatOnRampTransactionStatus.FAILED,
            externalTransactionId: transaction.externalSessionId,
            serviceProvider: transaction.provider,
          })
        }
      }
    })
  }, ms('30s'))

  // Triggers when the ActivityWeb query result changes, and updates the local status.
  // Once all FOR transactions are syncedWithBackend, we stop polling the GQL server for updates.
  // See the useInterval hook in AssetActivityProvider for the polling logic.
  useEffect(() => {
    query.data?.portfolios?.[0]?.assetActivities?.forEach((activity) => {
      if (
        activity?.details?.__typename === 'TransactionDetails' &&
        activity?.details?.type === 'ON_RAMP' &&
        activity.details.assetChanges.length > 0
      ) {
        const assetChange = activity.details.assetChanges[0]
        if (assetChange?.__typename !== 'OnRampTransfer') {
          logger.error('Unexpected asset change type, expected OnRampTransfer', {
            tags: {
              file: 'AssetActivityProvider',
              function: 'useInterval',
            },
          })
          return
        }
        const transaction = fiatOnRampTransactions[assetChange.externalSessionId]
        if (transaction) {
          dispatch(
            updateFiatOnRampTransaction({
              ...transaction,
              syncedWithBackend: true,
              status: backendStatusToFiatOnRampStatus(activity.details.status),
            }),
          )
          sendAnalyticsEvent(FiatOnRampEventName.FiatOnRampTransactionUpdated, {
            status: backendStatusToFiatOnRampStatus(activity.details.status),
            externalTransactionId: transaction.externalSessionId,
            serviceProvider: transaction.provider,
          })
        }
      }
    })
  }, [dispatch, fiatOnRampTransactions, query.data?.portfolios])

  return null
}
