import { useApolloClient } from '@apollo/client'
import { useQueryClient } from '@tanstack/react-query'
import { Transaction } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import dayjs from 'dayjs'
import { useEffect } from 'react'
import { batch, useDispatch, useSelector } from 'react-redux'
import { Flex } from 'ui/src'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { getListTransactionsQuery } from 'uniswap/src/data/rest/listTransactions'
import { parseToTransactionDetails } from 'uniswap/src/features/activity/parseToTransactionDetails'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useListTransactions } from 'uniswap/src/features/dataApi/listTransactions/listTransactions'
import { selectLastTxNotificationUpdate } from 'uniswap/src/features/notifications/slice/selectors'
import {
  pushNotification,
  setLastTxNotificationUpdate,
  setNotificationStatus,
} from 'uniswap/src/features/notifications/slice/slice'
import { ReceiveCurrencyTxNotification, ReceiveNFTNotification } from 'uniswap/src/features/notifications/slice/types'
import { GQL_QUERIES_TO_REFETCH_ON_TXN_UPDATE } from 'uniswap/src/features/portfolio/portfolioUpdates/constants'
import { useHideSpamTokensSetting } from 'uniswap/src/features/settings/hooks'
import { useSelectAddressTransactions } from 'uniswap/src/features/transactions/selectors'
import {
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { buildReceiveNotification } from 'wallet/src/features/notifications/buildReceiveNotification'
import { shouldSuppressNotification } from 'wallet/src/features/notifications/notificationWatcherSaga'
import { useActiveAccountAddress } from 'wallet/src/features/wallet/hooks'

/**
 * For all imported accounts, checks for new transactions and updates
 * the notification status in redux.
 */
export function TransactionHistoryUpdater(): JSX.Element | null {
  const activeAccountAddress = useActiveAccountAddress()
  const { chains } = useEnabledChains()

  // Poll for the active account only
  const shouldSkipActiveQuery = !activeAccountAddress
  const { data: activeAccountTransactions } = useListTransactions({
    evmAddress: activeAccountAddress ?? undefined,
    chainIds: chains,
    skip: shouldSkipActiveQuery,
    refetchInterval: shouldSkipActiveQuery ? 0 : PollingInterval.KindaFast,
  })

  if (!activeAccountTransactions?.length || !activeAccountAddress) {
    return null
  }

  return (
    <Flex key={activeAccountAddress} testID={`AddressTransactionHistoryUpdater/${activeAccountAddress}`}>
      <AddressTransactionHistoryUpdater transactions={activeAccountTransactions} address={activeAccountAddress} />
    </Flex>
  )
}

function AddressTransactionHistoryUpdater({
  address,
  transactions,
}: {
  address: string
  transactions: TransactionDetails[]
}): JSX.Element | null {
  const dispatch = useDispatch()
  const apolloClient = useApolloClient()

  const activeAccountAddress = useActiveAccountAddress()

  // Current txn count for all addresses
  const lastTxNotificationUpdateTimestamp = useSelector(selectLastTxNotificationUpdate)[address]

  const fetchAndDispatchReceiveNotification = useFetchAndDispatchReceiveNotification()

  // don't show notifications on spam tokens if setting enabled
  const hideSpamTokens = useHideSpamTokensSetting()

  const localTransactions = useSelectAddressTransactions({ evmAddress: address })

  useEffect(() => {
    batch(async () => {
      let newTransactionsFound = false

      // Parse txns and address from portfolio.
      transactions.forEach((transaction) => {
        if (!lastTxNotificationUpdateTimestamp) {
          dispatch(setLastTxNotificationUpdate({ address, timestamp: dayjs().valueOf() })) // Note this is in ms
          return
        }

        const updatedTimestampMs = transaction.addedTime
        const hasNewTxn = updatedTimestampMs > lastTxNotificationUpdateTimestamp

        if (hasNewTxn) {
          dispatch(setLastTxNotificationUpdate({ address, timestamp: updatedTimestampMs }))

          // Dont flag notification status for txns submitted from app, this is handled in transactionWatcherSaga.
          const confirmedLocally = localTransactions?.some(
            // oxlint-disable-next-line max-nested-callbacks
            (localTx) => localTx.hash === transaction.hash,
          )
          if (!confirmedLocally) {
            dispatch(setNotificationStatus({ address, hasNotifications: true }))
          }

          // full send refetch all active (mounted) queries
          newTransactionsFound = true
        }
      })

      // oxlint-disable-next-line typescript/no-unnecessary-condition
      if (newTransactionsFound && address === activeAccountAddress) {
        // Fetch full recent txn history and dispatch receive notification if needed.
        await fetchAndDispatchReceiveNotification({
          address,
          lastTxNotificationUpdateTimestamp,
          hideSpamTokens,
        })
        await apolloClient.refetchQueries({ include: GQL_QUERIES_TO_REFETCH_ON_TXN_UPDATE })
      }
    }).catch(() => undefined)
  }, [
    activeAccountAddress,
    address,
    apolloClient,
    dispatch,
    fetchAndDispatchReceiveNotification,
    hideSpamTokens,
    lastTxNotificationUpdateTimestamp,
    localTransactions,
    transactions,
  ])

  return null
}

/*
 * Fetch and search recent transactions for receive txn. If confirmed since the last status update timestamp,
 * dispatch notification update. We special case here because receive is never initiated within app.
 *
 * Note: we opt for a waterfall request here because full transaction data is a large query that we dont
 * want to submit every polling interval - only fetch this data if new txn is detected. This ideally gets
 * replaced with a subscription to new transactions with more full txn data.
 */
export function useFetchAndDispatchReceiveNotification(): (params: {
  address: string
  lastTxNotificationUpdateTimestamp: number | undefined
  hideSpamTokens?: boolean
}) => Promise<void> {
  const dispatch = useDispatch()
  const { chains } = useEnabledChains()
  const queryClient = useQueryClient()

  return async ({
    address,
    lastTxNotificationUpdateTimestamp,
    hideSpamTokens,
  }: {
    address: string
    lastTxNotificationUpdateTimestamp: number | undefined
    hideSpamTokens?: boolean
  }): Promise<void> => {
    // Fetch full transaction history for user address.
    const listTransactionsResponse = await queryClient.fetchQuery(
      getListTransactionsQuery({
        input: {
          evmAddress: address,
          chainIds: chains,
        },
      }),
    )

    const notification = getReceiveNotificationFromData({
      // Cached data is a plain message; the activity parsers read concrete-typed message fields.
      transactions: (listTransactionsResponse?.transactions ?? []) as Transaction[],
      address,
      lastTxNotificationUpdateTimestamp,
      hideSpamTokens,
    })

    if (notification) {
      dispatch(pushNotification(notification))
    }
  }
}

export function getReceiveNotificationFromData({
  transactions,
  address,
  lastTxNotificationUpdateTimestamp,
  hideSpamTokens = false,
}: {
  transactions: Transaction[]
  address: Address
  lastTxNotificationUpdateTimestamp?: number
  hideSpamTokens?: boolean
}): ReceiveCurrencyTxNotification | ReceiveNFTNotification | undefined {
  if (!lastTxNotificationUpdateTimestamp || !transactions.length) {
    return undefined
  }

  const parsedTxHistory = parseToTransactionDetails({
    transactions,
    hideSpamTokens,
  })
  if (!parsedTxHistory) {
    return undefined
  }

  const latestReceivedTx = parsedTxHistory
    .sort((a, b) => a.addedTime - b.addedTime)
    .find(
      (tx) =>
        tx.addedTime &&
        tx.addedTime >= lastTxNotificationUpdateTimestamp &&
        tx.typeInfo.type === TransactionType.Receive &&
        tx.status === TransactionStatus.Success,
    )

  // Suppress notification if rules apply
  if (!latestReceivedTx || shouldSuppressNotification({ tx: latestReceivedTx })) {
    return undefined
  }

  return buildReceiveNotification(latestReceivedTx, address)
}
