import { NetworkStatus, QueryHookOptions } from '@apollo/client'
import { PartialMessage } from '@bufbuild/protobuf'
import { FiatOnRampParams } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { GraphQLApi } from '@universe/api'
import isEqual from 'lodash/isEqual'
import { useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { ActivityItem } from 'uniswap/src/components/activity/generateActivityItemRenderer'
import { isLoadingItem, isSectionHeader, LoadingItem } from 'uniswap/src/components/activity/utils'
import { formatTransactionsByDate } from 'uniswap/src/features/activity/formatTransactionsByDate'
import { useMergeLocalAndRemoteTransactions } from 'uniswap/src/features/activity/hooks/useMergeLocalAndRemoteTransactions'
import { useListTransactions } from 'uniswap/src/features/dataApi/listTransactions/listTransactions'
import { useLocalizedDayjs } from 'uniswap/src/features/language/localizedDayjs'
import { useCurrencyIdToVisibility } from 'uniswap/src/features/transactions/selectors'
import { TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { isLimitOrder } from 'uniswap/src/features/transactions/utils/uniswapX.utils'
import { selectNftsVisibility } from 'uniswap/src/features/visibility/selectors'

const LOADING_ITEM = (index: number): LoadingItem => ({ itemType: 'LOADING', id: index })
const LOADING_DATA = [LOADING_ITEM(1), LOADING_ITEM(2), LOADING_ITEM(3), LOADING_ITEM(4)]

// Contract for returning Transaction data

type TransactionListQueryArgs = QueryHookOptions<
  GraphQLApi.TransactionListQuery,
  GraphQLApi.TransactionListQueryVariables
>
interface UseFormattedTransactionDataOptions {
  evmAddress?: Address
  svmAddress?: Address
  ownerAddresses: Address[]
  fiatOnRampParams: PartialMessage<FiatOnRampParams> | undefined
  hideSpamTokens: boolean
  pageSize?: number
  skip?: boolean
}

type FormattedTransactionInputs = UseFormattedTransactionDataOptions & TransactionListQueryArgs

export interface FormattedTransactionDataResult {
  hasData: boolean
  isLoading: boolean
  isError: Error | undefined
  sectionData: ActivityItem[] | undefined
  keyExtractor: (item: ActivityItem) => string
  onRetry: () => void
  skip?: boolean
}

/**
 * Hook that returns transaction data using REST API
 */
export function useFormattedTransactionDataForActivity({
  evmAddress,
  svmAddress,
  ownerAddresses,
  hideSpamTokens,
  pageSize,
  skip,
  ...queryOptions
}: FormattedTransactionInputs): FormattedTransactionDataResult {
  const { t } = useTranslation()

  const tokenVisibilityOverrides = useCurrencyIdToVisibility(ownerAddresses)
  const nftVisibility = useSelector(selectNftsVisibility)

  const {
    data: formattedTransactions,
    loading,
    error,
    refetch,
    networkStatus,
  } = useListTransactions({
    evmAddress,
    svmAddress,
    pageSize,
    hideSpamTokens,
    tokenVisibilityOverrides,
    nftVisibility,
    skip,
    ...queryOptions,
  })

  const keyExtractor = useMemo(
    () => createTransactionKeyExtractor(evmAddress ?? svmAddress ?? ''),
    [evmAddress, svmAddress],
  )

  const transactions = useMergeLocalAndRemoteTransactions({
    evmAddress,
    svmAddress,
    remoteTransactions: formattedTransactions,
  })

  // TODO(PORT-429): update to only TradingApi.Routing.DUTCH_V2 once limit orders can be excluded from REST query
  const transactionsWithOutLimitOrders = useMemo(() => transactions?.filter((tx) => !isLimitOrder(tx)), [transactions])

  // Format transactions for section list
  const localizedDayjs = useLocalizedDayjs()
  const { pending, todayTransactionList, yesterdayTransactionList, priorByMonthTransactionList } = useMemo(
    () => formatTransactionsByDate(transactionsWithOutLimitOrders, localizedDayjs),
    [transactionsWithOutLimitOrders, localizedDayjs],
  )

  const hasTransactions = transactions && transactions.length > 0
  const hasData = Boolean(formattedTransactions?.length)

  // show loading if no data and fetching, or refetching when there is error (for UX when "retry" is clicked).
  const showLoading = (!hasData && loading) || (Boolean(error) && networkStatus === NetworkStatus.loading)

  const sectionData = useMemo(
    () =>
      createTransactionSectionData({
        showLoading,
        hasTransactions,
        pending,
        todayTransactionList,
        yesterdayTransactionList,
        priorByMonthTransactionList,
        todayLabel: t('common.today'),
        yesterdayLabel: t('common.yesterday'),
      }),
    [
      showLoading,
      hasTransactions,
      pending,
      todayTransactionList,
      yesterdayTransactionList,
      priorByMonthTransactionList,
      t,
    ],
  )

  const memoizedSectionData = useMemoizedTransactionSectionData(sectionData, keyExtractor)

  const onRetry = useCallback(async () => {
    await refetch()
  }, [refetch])

  return {
    onRetry,
    sectionData: memoizedSectionData,
    hasData,
    isError: error ?? undefined,
    isLoading: loading,
    keyExtractor,
  }
}

/**
 * Extracts a unique key for each transaction list item
 * Used for caching and as the React key in our List component.
 */
function createTransactionKeyExtractor(address: Address) {
  return (info: ActivityItem): string => {
    if (isLoadingItem(info)) {
      return `${address}-${info.id}` // for loading items, use the index as the key
    }

    if (isSectionHeader(info)) {
      return `${address}-${info.title}` // for section headers, use the title as the key
    }

    return info.id // for transactions, use the transaction hash as the key
  }
}

/**
 * Logic to group transactions into discrete sections based on their age
 * This is how transactions are grouped in the Activity tab
 */
function createTransactionSectionData({
  showLoading,
  hasTransactions,
  pending,
  todayTransactionList,
  yesterdayTransactionList,
  priorByMonthTransactionList,
  todayLabel,
  yesterdayLabel,
}: {
  showLoading: boolean
  hasTransactions?: boolean
  pending: TransactionDetails[]
  todayTransactionList: TransactionDetails[]
  yesterdayTransactionList: TransactionDetails[]
  priorByMonthTransactionList: Record<string, TransactionDetails[]>
  todayLabel: string
  yesterdayLabel: string
}): ActivityItem[] | undefined {
  if (showLoading) {
    return LOADING_DATA
  }

  if (!hasTransactions) {
    return undefined
  }

  return [
    // Add Today section if it has transactions (including pending)
    ...(todayTransactionList.length > 0 || pending.length > 0
      ? [
          { itemType: 'HEADER' as const, title: todayLabel },
          ...pending, // Show pending transactions first
          ...todayTransactionList,
        ]
      : []),
    // Add Yesterday section if it has transactions
    ...(yesterdayTransactionList.length > 0
      ? [{ itemType: 'HEADER' as const, title: yesterdayLabel }, ...yesterdayTransactionList]
      : []),
    // for each month prior, detect length and render if includes transactions
    ...Object.keys(priorByMonthTransactionList).reduce((accum: ActivityItem[], month) => {
      const transactionList = priorByMonthTransactionList[month]
      if (transactionList && transactionList.length > 0) {
        accum.push({ itemType: 'HEADER' as const, title: month }, ...transactionList)
      }
      return accum
    }, []),
  ]
}

/**
 * Memoizing section data to prevent unnecessary re-renders
 */
function useMemoizedTransactionSectionData(
  sectionData: ActivityItem[] | undefined,
  keyExtractor: (item: ActivityItem) => string,
): ActivityItem[] | undefined {
  const memoizedSectionDataRef = useRef<typeof sectionData | undefined>(undefined)

  // Each `transaction` object is recreated every time the query is refetched.
  // To avoid re-rendering every single item (even the ones that didn't change), we go through the results and compare them with the previous results.
  // If the `transaction` already exists in the previous results and is equal to the new one, we keep the reference to old one.
  // This means that `TransactionSummaryLayout` won't re-render because the props will be exactly the same.
  const memoizedSectionData: ActivityItem[] | undefined = useMemo(() => {
    if (!memoizedSectionDataRef.current || !sectionData) {
      return sectionData
    }

    return sectionData.map((newItem): ActivityItem => {
      const newItemKey = keyExtractor(newItem)
      const oldItem = memoizedSectionDataRef.current?.find((_oldItem) => newItemKey === keyExtractor(_oldItem))
      if (oldItem && isEqual(newItem, oldItem)) {
        return oldItem
      }
      return newItem
    })
  }, [keyExtractor, sectionData])

  memoizedSectionDataRef.current = memoizedSectionData
  return memoizedSectionData
}
