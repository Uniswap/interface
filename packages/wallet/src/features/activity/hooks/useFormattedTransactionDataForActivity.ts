import { ApolloError, NetworkStatus, QueryHookOptions } from '@apollo/client'
import isEqual from 'lodash/isEqual'
import { useCallback, useMemo, useRef } from 'react'
import { useSelector } from 'react-redux'
import {
  TransactionListQuery,
  TransactionListQueryVariables,
  useTransactionListQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { usePersistedError } from 'uniswap/src/features/dataApi/utils'
import { useLocalizedDayjs } from 'uniswap/src/features/language/localizedDayjs'
import { useCurrencyIdToVisibility } from 'uniswap/src/features/transactions/selectors'
import { TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { selectNftsVisibility } from 'uniswap/src/features/visibility/selectors'
import { isNonPollingRequestInFlight } from 'wallet/src/data/utils'
import { LoadingItem, SectionHeader, isLoadingItem, isSectionHeader } from 'wallet/src/features/activity/utils'
import {
  formatTransactionsByDate,
  parseDataResponseToTransactionDetails,
} from 'wallet/src/features/transactions/history/utils'
import { useMergeLocalAndRemoteTransactions } from 'wallet/src/features/transactions/hooks'
import { useAccounts } from 'wallet/src/features/wallet/hooks'

const LOADING_ITEM = (index: number): LoadingItem => ({ itemType: 'LOADING', id: index })
const LOADING_DATA = [LOADING_ITEM(1), LOADING_ITEM(2), LOADING_ITEM(3), LOADING_ITEM(4)]

export function useFormattedTransactionDataForActivity({
  address,
  hideSpamTokens,
  pageSize,
  ...queryOptions
}: {
  address: Address
  hideSpamTokens: boolean
  pageSize?: number
} & QueryHookOptions<TransactionListQuery, TransactionListQueryVariables>): {
  hasData: boolean
  isLoading: boolean
  isError: ApolloError | undefined
  sectionData: Array<TransactionDetails | SectionHeader | LoadingItem> | undefined
  keyExtractor: (item: TransactionDetails | SectionHeader | LoadingItem) => string
  onRetry: () => void
} {
  const { gqlChains } = useEnabledChains()

  const {
    refetch,
    networkStatus,
    loading: requestLoading,
    data,
    error: requestError,
  } = useTransactionListQuery({
    ...queryOptions,
    variables: { address, chains: gqlChains, pageSize },
    notifyOnNetworkStatusChange: true,
    // rely on TransactionHistoryUpdater for polling
    pollInterval: undefined,
  })

  const addresses = Object.keys(useAccounts())
  const tokenVisibilityOverrides = useCurrencyIdToVisibility(addresses)
  const nftVisibility = useSelector(selectNftsVisibility)

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
    [address],
  )

  const formattedTransactions = useMemo(() => {
    if (!data) {
      return undefined
    }

    return parseDataResponseToTransactionDetails(data, hideSpamTokens, nftVisibility, tokenVisibilityOverrides)
  }, [data, hideSpamTokens, tokenVisibilityOverrides, nftVisibility])

  const transactions = useMergeLocalAndRemoteTransactions(address, formattedTransactions)

  // Format transactions for section list
  const localizedDayjs = useLocalizedDayjs()
  const { pending, last24hTransactionList, priorByMonthTransactionList } = useMemo(
    () => formatTransactionsByDate(transactions, localizedDayjs),
    [transactions, localizedDayjs],
  )

  const hasTransactions = transactions && transactions.length > 0

  const hasData = !!data?.portfolios?.[0]?.assetActivities?.length
  const isLoading = isNonPollingRequestInFlight(networkStatus)
  const isError = usePersistedError(requestLoading, requestError)

  // show loading if no data and fetching, or refetching when there is error (for UX when "retry" is clicked).
  const showLoading = (!hasData && isLoading) || (Boolean(isError) && networkStatus === NetworkStatus.refetch)

  const sectionData = useMemo(() => {
    if (showLoading) {
      return LOADING_DATA
    }

    if (!hasTransactions) {
      return undefined
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
        [],
      ),
    ]
  }, [showLoading, hasTransactions, pending, last24hTransactionList, priorByMonthTransactionList])

  const memoizedSectionDataRef = useRef<typeof sectionData | undefined>(undefined)

  // Each `transaction` object is recreated every time the query is refetched.
  // To avoid re-rendering every single item (even the ones that didn't change), we go through the results and compare them with the previous results.
  // If the `transaction` already exists in the previous results and is equal to the new one, we keep the reference to old one.
  // This means that `TransactionSummaryLayout` won't re-render because the props will be exactly the same.
  const memoizedSectionData = useMemo(() => {
    if (!memoizedSectionDataRef.current || !sectionData) {
      return sectionData
    }

    return sectionData.map((newItem) => {
      const newItemKey = keyExtractor(newItem)
      const oldItem = memoizedSectionDataRef.current?.find((_oldItem) => newItemKey === keyExtractor(_oldItem))
      if (oldItem && isEqual(newItem, oldItem)) {
        return oldItem
      }
      return newItem
    })
  }, [keyExtractor, sectionData])

  memoizedSectionDataRef.current = memoizedSectionData

  const onRetry = useCallback(async () => {
    await refetch({
      address,
    })
  }, [address, refetch])

  return { onRetry, sectionData: memoizedSectionData, hasData, isError, isLoading, keyExtractor }
}
