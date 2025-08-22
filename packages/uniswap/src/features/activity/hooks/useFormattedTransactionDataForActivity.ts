import { NetworkStatus, QueryHookOptions } from '@apollo/client'
import { PartialMessage } from '@bufbuild/protobuf'
import {
  FiatOnRampParams,
  ListTransactionsRequest,
  ListTransactionsResponse,
} from '@uniswap/client-data-api/dist/data/v1/api_pb'
import isEqual from 'lodash/isEqual'
import { useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { ActivityItem } from 'uniswap/src/components/activity/generateActivityItemRenderer'
import { LoadingItem, isLoadingItem, isSectionHeader } from 'uniswap/src/components/activity/utils'
import {
  TransactionListQuery,
  TransactionListQueryVariables,
  useTransactionListQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { useListTransactionsQuery } from 'uniswap/src/data/rest/listTransactions'
import { isNonPollingRequestInFlight } from 'uniswap/src/data/utils'
import { formatTransactionsByDate } from 'uniswap/src/features/activity/formatTransactionsByDate'
import { useMergeLocalAndRemoteTransactions } from 'uniswap/src/features/activity/hooks/useMergeLocalAndRemoteTransactions'
import {
  parseDataResponseToTransactionDetails,
  parseRestResponseToTransactionDetails,
} from 'uniswap/src/features/activity/parseRestResponse'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { usePersistedError } from 'uniswap/src/features/dataApi/utils/usePersistedError'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { useLocalizedDayjs } from 'uniswap/src/features/language/localizedDayjs'
import { useCurrencyIdToVisibility } from 'uniswap/src/features/transactions/selectors'
import { TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { selectNftsVisibility } from 'uniswap/src/features/visibility/selectors'
import { useEvent } from 'utilities/src/react/hooks'

const LOADING_ITEM = (index: number): LoadingItem => ({ itemType: 'LOADING', id: index })
const LOADING_DATA = [LOADING_ITEM(1), LOADING_ITEM(2), LOADING_ITEM(3), LOADING_ITEM(4)]

// Contract for returning Transaction data

type TransactionListQueryArgs = QueryHookOptions<TransactionListQuery, TransactionListQueryVariables>
interface UseFormattedTransactionDataOptions {
  address: Address
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
 * Factory hook that returns transaction data based on the active data source (GraphQL or REST)
 */
export function useFormattedTransactionDataForActivity({
  ...queryOptions
}: FormattedTransactionInputs): FormattedTransactionDataResult {
  const isRestEnabled = useFeatureFlag(FeatureFlags.GqlToRestTransactions)

  const graphqlResult = useGraphQLFormattedTransactionDataForActivity({
    ...queryOptions,
    skip: isRestEnabled || queryOptions.skip,
  })

  const restResult = useRESTFormattedTransactionDataForActivity({
    ...queryOptions,
    skip: !isRestEnabled || queryOptions.skip,
  })

  return isRestEnabled ? restResult : graphqlResult
}

/**
 * GraphQL implementation for formatting transaction data
 * @deprecated - TODO(WALL-6789): remove once rest migration is complete
 *  */
export function useGraphQLFormattedTransactionDataForActivity({
  address,
  ownerAddresses,
  hideSpamTokens,
  pageSize,
  ...queryOptions
}: FormattedTransactionInputs): FormattedTransactionDataResult {
  const { t } = useTranslation()
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

  const tokenVisibilityOverrides = useCurrencyIdToVisibility(ownerAddresses)
  const nftVisibility = useSelector(selectNftsVisibility)

  const keyExtractor = useCallback(
    (info: ActivityItem) => {
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

    return parseDataResponseToTransactionDetails({
      data,
      hideSpamTokens,
      nftVisibility,
      tokenVisibilityOverrides,
    })
  }, [data, hideSpamTokens, tokenVisibilityOverrides, nftVisibility])

  const transactions = useMergeLocalAndRemoteTransactions(address, formattedTransactions)

  // Format transactions for section list
  const localizedDayjs = useLocalizedDayjs()
  const { pending, todayTransactionList, yesterdayTransactionList, priorByMonthTransactionList } = useMemo(
    () => formatTransactionsByDate(transactions, localizedDayjs),
    [transactions, localizedDayjs],
  )

  const hasTransactions = transactions && transactions.length > 0

  const hasData = !!data?.portfolios?.[0]?.assetActivities?.length
  const isLoading = isNonPollingRequestInFlight(networkStatus)
  const isError = usePersistedError(requestLoading, requestError)

  // show loading if no data and fetching, or refetching when there is error (for UX when "retry" is clicked).
  const showLoading = (!hasData && isLoading) || (Boolean(isError) && networkStatus === NetworkStatus.refetch)

  const sectionData: ActivityItem[] | undefined = useMemo(() => {
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
            { itemType: 'HEADER' as const, title: t('common.today') },
            ...pending, // Show pending transactions first
            ...todayTransactionList,
          ]
        : []),
      // Add Yesterday section if it has transactions
      ...(yesterdayTransactionList.length > 0
        ? [{ itemType: 'HEADER' as const, title: t('common.yesterday') }, ...yesterdayTransactionList]
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
  }, [
    showLoading,
    hasTransactions,
    pending,
    todayTransactionList,
    yesterdayTransactionList,
    priorByMonthTransactionList,
    t,
  ])

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

export function useRESTFormattedTransactionDataForActivity({
  address,
  ownerAddresses,
  hideSpamTokens,
  pageSize,
  fiatOnRampParams,
  ...queryOptions
}: {
  fiatOnRampParams: PartialMessage<FiatOnRampParams> | undefined
} & UseFormattedTransactionDataOptions &
  PartialMessage<ListTransactionsRequest>): FormattedTransactionDataResult {
  const { t } = useTranslation()
  const { chains: chainIds } = useEnabledChains()

  const tokenVisibilityOverrides = useCurrencyIdToVisibility(ownerAddresses)
  const nftVisibility = useSelector(selectNftsVisibility)

  const selectFormattedData = useEvent((transactionData: ListTransactionsResponse | undefined) => {
    if (!transactionData) {
      return undefined
    }

    return parseRestResponseToTransactionDetails({
      data: transactionData,
      hideSpamTokens,
      nftVisibility,
      tokenVisibilityOverrides,
    })
  })

  const {
    data: formattedTransactions,
    isLoading,
    error,
    refetch,
  } = useListTransactionsQuery({
    input: {
      evmAddress: address,
      chainIds,
      pageSize,
      fiatOnRampParams,
    },
    enabled: !queryOptions.skip,
    select: selectFormattedData,
  })

  const keyExtractor = useMemo(() => createTransactionKeyExtractor(address), [address])

  const transactions = useMergeLocalAndRemoteTransactions(address, formattedTransactions)

  // Format transactions for section list
  const localizedDayjs = useLocalizedDayjs()
  const { pending, todayTransactionList, yesterdayTransactionList, priorByMonthTransactionList } = useMemo(
    () => formatTransactionsByDate(transactions, localizedDayjs),
    [transactions, localizedDayjs],
  )

  const hasTransactions = transactions && transactions.length > 0
  const hasData = Boolean(formattedTransactions?.length)

  // show loading if no data and fetching, or refetching when there is error (for UX when "retry" is clicked).
  const showLoading = (!hasData && isLoading) || (Boolean(error) && isLoading)

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

  const onRetry = useCallback(async () => await refetch(), [refetch])

  return {
    onRetry,
    sectionData: memoizedSectionData,
    hasData,
    isError: error ?? undefined,
    isLoading,
    keyExtractor,
  }
}
