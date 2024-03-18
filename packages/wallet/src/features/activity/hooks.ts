import { ApolloError, NetworkStatus } from '@apollo/client'
import { useCallback, useMemo } from 'react'
import {
  useFeedTransactionListQuery,
  useTransactionListQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { PollingInterval } from 'wallet/src/constants/misc'
import { isNonPollingRequestInFlight } from 'wallet/src/data/utils'
import { usePersistedError } from 'wallet/src/features/dataApi/utils'
import { useLocalizedDayjs } from 'wallet/src/features/language/localizedDayjs'
import {
  formatTransactionsByDate,
  parseDataResponseToFeedTransactionDetails,
  parseDataResponseToTransactionDetails,
} from 'wallet/src/features/transactions/history/utils'
import { TransactionDetails } from 'wallet/src/features/transactions/types'
import { LoadingItem, SectionHeader, isLoadingItem, isSectionHeader } from './utils'

const LOADING_ITEM = (index: number): LoadingItem => ({ itemType: 'LOADING', id: index })
const LOADING_DATA = [LOADING_ITEM(1), LOADING_ITEM(2), LOADING_ITEM(3), LOADING_ITEM(4)]

export function useFormattedTransactionDataForFeed(
  addresses: Address[],
  hideSpamTokens: boolean
): {
  hasData: boolean
  isLoading: boolean
  isError: ApolloError | undefined
  sectionData: Array<TransactionDetails | SectionHeader | LoadingItem> | undefined
  keyExtractor: (item: TransactionDetails | SectionHeader | LoadingItem) => string
  onRetry: () => void
} {
  const {
    refetch,
    networkStatus,
    loading: requestLoading,
    data,
    error: requestError,
  } = useFeedTransactionListQuery({
    variables: { addresses },
    notifyOnNetworkStatusChange: true,
    // TODO: determine how often to poll for feed - currently slow
    pollInterval: PollingInterval.Slow,
  })

  const keyExtractor = useCallback((info: TransactionDetails | SectionHeader | LoadingItem) => {
    // for loading items, use the index as the key
    if (isLoadingItem(info)) {
      return `feed-${info.id}`
    }
    // for section headers, use the title as the key
    if (isSectionHeader(info)) {
      return `feed-${info.title}`
    }
    // for transactions, use the transaction hash as the key
    return info.id
  }, [])

  const transactions = useMemo(() => {
    if (!data) {
      return
    }

    return parseDataResponseToFeedTransactionDetails(data, hideSpamTokens)
  }, [data, hideSpamTokens])

  // Format transactions for section list
  const localizedDayjs = useLocalizedDayjs()
  const { pending, last24hTransactionList, priorByMonthTransactionList } = useMemo(
    () => formatTransactionsByDate(transactions, localizedDayjs),
    [transactions, localizedDayjs]
  )

  const hasTransactions = transactions && transactions.length > 0

  const hasData = !!data?.portfolios?.[0]?.assetActivities
  const isLoading = isNonPollingRequestInFlight(networkStatus)
  const isError = usePersistedError(requestLoading, requestError)

  // show loading if no data and fetching, or refetching when there is error (for UX when "retry" is clicked).
  const showLoading =
    (!hasData && isLoading) || (Boolean(isError) && networkStatus === NetworkStatus.refetch)

  const sectionData = useMemo(() => {
    if (showLoading) {
      return LOADING_DATA
    }

    if (!hasTransactions) {
      return
    }

    return [
      ...pending,
      ...last24hTransactionList,
      // for each month prior, detect length and render if includes transactions
      ...Object.keys(priorByMonthTransactionList).reduce(
        (accum: (TransactionDetails | SectionHeader | LoadingItem)[], month) => {
          const transactionList = priorByMonthTransactionList[month]
          if (transactionList && transactionList.length > 0) {
            accum.push({ itemType: 'HEADER', title: month }, ...transactionList)
          }
          return accum
        },
        []
      ),
    ]
  }, [showLoading, hasTransactions, pending, last24hTransactionList, priorByMonthTransactionList])

  const onRetry = useCallback(async () => {
    await refetch({
      addresses,
    })
  }, [addresses, refetch])

  return { onRetry, sectionData, hasData, isError, isLoading, keyExtractor }
}

export function useFormattedTransactionDataForActivity(
  address: Address,
  hideSpamTokens: boolean,
  useMergeLocalFunction: (
    address: Address,
    remoteTransactions: TransactionDetails[] | undefined
  ) => TransactionDetails[] | undefined
): {
  hasData: boolean
  isLoading: boolean
  isError: ApolloError | undefined
  sectionData: Array<TransactionDetails | SectionHeader | LoadingItem> | undefined
  keyExtractor: (item: TransactionDetails | SectionHeader | LoadingItem) => string
  onRetry: () => void
} {
  const {
    refetch,
    networkStatus,
    loading: requestLoading,
    data,
    error: requestError,
  } = useTransactionListQuery({
    variables: { address },
    notifyOnNetworkStatusChange: true,
    // rely on TransactionHistoryUpdater for polling
    pollInterval: undefined,
  })

  const keyExtractor = useCallback(
    (info: TransactionDetails | SectionHeader | LoadingItem) => {
      // for loading items, use the index as the key
      if (isLoadingItem(info)) {
        return `${address}-${info.id}`
      }
      // for section headers, use the title as the key
      if (isSectionHeader(info)) {
        return `${address}-${info.title}`
      }
      // for transactions, use the transaction hash as the key
      return info.id
    },
    [address]
  )

  const formattedTransactions = useMemo(() => {
    if (!data) {
      return
    }

    return parseDataResponseToTransactionDetails(data, hideSpamTokens)
  }, [data, hideSpamTokens])

  const transactions = useMergeLocalFunction(address, formattedTransactions)

  // Format transactions for section list
  const localizedDayjs = useLocalizedDayjs()
  const { pending, last24hTransactionList, priorByMonthTransactionList } = useMemo(
    () => formatTransactionsByDate(transactions, localizedDayjs),
    [transactions, localizedDayjs]
  )

  const hasTransactions = transactions && transactions.length > 0

  const hasData = !!data?.portfolios?.[0]?.assetActivities?.length
  const isLoading = isNonPollingRequestInFlight(networkStatus)
  const isError = usePersistedError(requestLoading, requestError)

  // show loading if no data and fetching, or refetching when there is error (for UX when "retry" is clicked).
  const showLoading =
    (!hasData && isLoading) || (Boolean(isError) && networkStatus === NetworkStatus.refetch)

  const sectionData = useMemo(() => {
    if (showLoading) {
      return LOADING_DATA
    }

    if (!hasTransactions) {
      return
    }

    return [
      ...pending,
      ...last24hTransactionList,
      // for each month prior, detect length and render if includes transactions
      ...Object.keys(priorByMonthTransactionList).reduce(
        (accum: (TransactionDetails | SectionHeader | LoadingItem)[], month) => {
          const transactionList = priorByMonthTransactionList[month]
          if (transactionList && transactionList.length > 0) {
            accum.push({ itemType: 'HEADER', title: month }, ...transactionList)
          }
          return accum
        },
        []
      ),
    ]
  }, [showLoading, hasTransactions, pending, last24hTransactionList, priorByMonthTransactionList])

  const onRetry = useCallback(async () => {
    await refetch({
      address,
    })
  }, [address, refetch])

  return { onRetry, sectionData, hasData, isError, isLoading, keyExtractor }
}
