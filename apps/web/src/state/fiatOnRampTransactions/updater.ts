import ms from 'ms'
import { ForApiClient } from 'uniswap/src/data/apiClients/forApi/ForApiClient'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { FiatOnRampEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { useInterval } from '~/lib/hooks/useInterval'
import { useFiatOnRampTransactions } from '~/state/fiatOnRampTransactions/hooks'
import { removeFiatOnRampTransaction, updateFiatOnRampTransaction } from '~/state/fiatOnRampTransactions/reducer'
import { FiatOnRampTransactionStatus, FiatOnRampTransactionType } from '~/state/fiatOnRampTransactions/types'
import { statusToTransactionInfoStatus } from '~/state/fiatOnRampTransactions/utils'
import { useAppDispatch } from '~/state/hooks'
import { popupRegistry } from '~/state/popups/registry'
import { PopupType } from '~/state/popups/types'

export default function Updater(): null {
  const transactions = useFiatOnRampTransactions()
  const dispatch = useAppDispatch()

  // Polls the fiat on-ramp API for new FOR transactions, until Meld returns a valid result for each.
  useInterval(() => {
    Object.values(transactions).forEach(async (transaction) => {
      if (!transaction.forceFetched && transaction.type === FiatOnRampTransactionType.BUY) {
        const data = await ForApiClient.getTransaction({
          sessionId: transaction.externalSessionId,
          forceFetch: true,
        })
        if (data.transaction) {
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

  // Polls pending off ramp transactions
  useInterval(() => {
    Object.values(transactions).forEach(async (transaction) => {
      if (
        transaction.type === FiatOnRampTransactionType.SELL &&
        (!transaction.forceFetched || transaction.status === FiatOnRampTransactionStatus.PENDING)
      ) {
        const data = await ForApiClient.getTransaction({
          sessionId: transaction.externalSessionId,
          forceFetch: true,
        })
        if (data.transaction) {
          if (!transaction.original) {
            dispatch(
              updateFiatOnRampTransaction({
                ...transaction,
                original: data.transaction,
                forceFetched: true,
              }),
            )
          } else {
            const newStatus = statusToTransactionInfoStatus(data.transaction.status)
            if (transaction.status !== newStatus) {
              const currencyId = buildCurrencyId(
                Number(data.transaction.cryptoDetails?.chainId) as UniverseChainId,
                data.transaction.destinationContractAddress,
              )

              const popupKey = `forTransaction-${transaction.externalSessionId}`
              popupRegistry.removePopup(popupKey)
              popupRegistry.addPopup(
                { type: PopupType.FORTransaction, currencyId, transaction: data.transaction },
                popupKey,
                Infinity,
              )

              dispatch(
                updateFiatOnRampTransaction({
                  ...transaction,
                  original: data.transaction,
                  status: newStatus,
                }),
              )
            }
          }
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
  }, ms('5s'))

  return null
}
