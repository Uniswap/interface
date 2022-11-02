import { graphql } from 'babel-plugin-relay/macro'
import { TFunction } from 'i18next'
import React, { ReactElement, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { SectionList, SectionListData } from 'react-native'
import { PreloadedQuery, usePreloadedQuery } from 'react-relay'
import { Suspense } from 'src/components/data/Suspense'
import { Box } from 'src/components/layout'
import { Loading } from 'src/components/loading'
import { Text } from 'src/components/Text'
import {
  TransactionListQuery,
  TransactionListQuery$data,
} from 'src/components/TransactionList/__generated__/TransactionListQuery.graphql'
import { EMPTY_ARRAY } from 'src/constants/misc'
import {
  formatTransactionsByDate,
  parseDataResponseToTransactionDetails,
} from 'src/features/transactions/history/utils'
import { useMergeLocalAndRemoteTransactions } from 'src/features/transactions/hooks'
import TransactionSummaryRouter from 'src/features/transactions/SummaryCards/TransactionSummaryRouter'
import { TransactionDetails, TransactionStatus } from 'src/features/transactions/types'

const PENDING_TITLE = (t: TFunction) => t('Pending')
const TODAY_TITLE = (t: TFunction) => t('Today')
const MONTH_TITLE = (t: TFunction) => t('This Month')

const key = (info: TransactionDetails) => info.hash

const SectionTitle: SectionList['props']['renderSectionHeader'] = ({ section: { title } }) => (
  <Box pb="xxxs" pt="sm" px="xs">
    <Text color="textSecondary" variant="subheadSmall">
      {title}
    </Text>
  </Box>
)

export const transactionListQuery = graphql`
  query TransactionListQuery($address: String!) {
    portfolio(ownerAddress: $address) {
      assetActivities(pageSize: 50, page: 1) {
        timestamp
        type
        transaction {
          hash
          status
          to
          from
        }
        assetChanges {
          __typename
          ... on TokenTransfer {
            asset {
              name
              symbol
              address
              decimals
              chain
            }
            tokenStandard
            quantity
            sender
            recipient
            direction
            transactedValue {
              currency
              value
            }
          }
          ... on NftTransfer {
            asset {
              name
              nftContract {
                chain
                address
              }
              tokenId
              imageUrl
              collection {
                name
              }
            }
            nftStandard
            sender
            recipient
            direction
          }
          ... on TokenApproval {
            asset {
              name
              symbol
              decimals
              address
              chain
            }
            tokenStandard
            approvedAddress
            quantity
          }
        }
      }
    }
  }
`

export type TransactionListQueryResponse = NonNullable<
  NonNullable<TransactionListQuery$data['portfolio']>['assetActivities']
>[0]

interface TransactionListProps {
  ownerAddress: Address
  preloadedQuery: NullUndefined<PreloadedQuery<TransactionListQuery>>
  readonly: boolean
  emptyStateContent: ReactElement | null
}

const suspend = () => new Promise(() => {})

export default function TransactionList(props: TransactionListProps) {
  return (
    <Suspense
      fallback={
        <Box>
          <Loading type="transactions" />
        </Box>
      }>
      <TransactionListInner {...props} />
    </Suspense>
  )
}

/** Displays historical and pending transactions for a given address. */
function TransactionListInner({
  ownerAddress,
  preloadedQuery,
  readonly,
  emptyStateContent,
}: TransactionListProps) {
  // force a fallback if the query is not yet loaded
  if (!preloadedQuery) {
    throw suspend()
  }

  const { t } = useTranslation()

  // Parse remote txn data from query and merge with local txn data
  const transactionData = usePreloadedQuery<TransactionListQuery>(
    transactionListQuery,
    preloadedQuery
  )
  // format local and remote fetched txns
  const formattedTransactions = useMemo(
    () => (transactionData ? parseDataResponseToTransactionDetails(transactionData) : []),
    [transactionData]
  )
  const transactions = useMergeLocalAndRemoteTransactions(ownerAddress, formattedTransactions)
  // Format transactions for section list
  const {
    pending,
    todayTransactionList,
    monthTransactionList,
    priorByMonthTransactionList,
    combinedTransactionList,
  } = useMemo(() => formatTransactionsByDate(transactions), [transactions])

  const hasTransactions = combinedTransactionList?.length > 0

  const sectionData = useMemo(() => {
    if (!hasTransactions) {
      return EMPTY_ARRAY
    }
    return [
      ...(pending.length > 0 ? [{ title: PENDING_TITLE(t), data: pending }] : []),
      ...(todayTransactionList.length > 0
        ? [{ title: TODAY_TITLE(t), data: todayTransactionList }]
        : []),
      ...(monthTransactionList.length > 0
        ? [{ title: MONTH_TITLE(t), data: monthTransactionList }]
        : []),
      // for each month prior, detect length and render if includes transactions
      ...Object.keys(priorByMonthTransactionList).reduce(
        (
          accum: {
            title: string
            data: TransactionDetails[]
          }[],
          month
        ) => {
          const transactionList = priorByMonthTransactionList[month]
          if (transactionList.length > 0) {
            accum.push({ title: month, data: transactionList })
          }
          return accum
        },
        []
      ),
    ]
  }, [
    hasTransactions,
    monthTransactionList,
    pending,
    priorByMonthTransactionList,
    t,
    todayTransactionList,
  ])

  const renderItem = useMemo(() => {
    return ({
      item,
    }: {
      item: TransactionDetails
      index: number
      section: SectionListData<TransactionDetails>
    }) => {
      const currentIsIsolated = item?.status === TransactionStatus.Cancelling

      return (
        <TransactionSummaryRouter
          mb={currentIsIsolated ? 'md' : 'none'}
          readonly={readonly}
          showInlineWarning={!currentIsIsolated}
          transaction={item}
        />
      )
    }
  }, [readonly])

  if (!hasTransactions) {
    return emptyStateContent
  }

  return (
    <SectionList
      keyExtractor={key}
      renderItem={renderItem}
      renderSectionHeader={SectionTitle}
      sections={sectionData}
      showsVerticalScrollIndicator={false}
      stickySectionHeadersEnabled={false}
      windowSize={5}
    />
  )
}
