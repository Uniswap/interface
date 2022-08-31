import dayjs from 'dayjs'
import { TFunction } from 'i18next'
import React, { ReactElement, Suspense, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { SectionList, SectionListData } from 'react-native'
import { Box } from 'src/components/layout'
import { Loading } from 'src/components/loading'
import { Text } from 'src/components/Text'
import { EMPTY_ARRAY } from 'src/constants/misc'
import { useAllFormattedTransactions } from 'src/features/transactions/hooks'
import TransactionSummaryRouter from 'src/features/transactions/SummaryCards/TransactionSummaryRouter'
import { TransactionDetails, TransactionStatus } from 'src/features/transactions/types'

const PENDING_TITLE = (t: TFunction) => t('Pending')
const TODAY_TITLE = (t: TFunction) => t('Today')
const MONTH_TITLE = dayjs().format('MMMM')
const YEAR_TITLE = dayjs().year().toString()

const key = (info: TransactionDetails) => info.hash

export default function TransactionList({
  address,
  readonly,
  emptyStateContent,
}: {
  address: Address
  readonly: boolean
  emptyStateContent: React.ReactElement | null
}) {
  return (
    <Suspense fallback={<Loading repeat={4} type="box" />}>
      <TransactionSectionList
        address={address}
        emptyStateContent={emptyStateContent}
        readonly={readonly}
      />
    </Suspense>
  )
}

const SectionTitle: SectionList['props']['renderSectionHeader'] = ({ section: { title } }) => (
  <Box px="xs" py="md">
    <Text color="textSecondary" variant="smallLabel">
      {title}
    </Text>
  </Box>
)

/** Displays historical and pending transactions for a given address. */
export function TransactionSectionList({
  address,
  readonly,
  emptyStateContent,
}: {
  address: Address
  readonly: boolean
  emptyStateContent: ReactElement | null
}) {
  const { t } = useTranslation()

  const {
    pending,
    todayTransactionList,
    monthTransactionList,
    yearTransactionList,
    priorByYearTransactionList,
    combinedTransactionList,
  } = useAllFormattedTransactions(address)

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
        ? [{ title: MONTH_TITLE, data: monthTransactionList }]
        : []),
      ...(yearTransactionList.length > 0 ? [{ title: YEAR_TITLE, data: yearTransactionList }] : []),
      // for each year prior, detect length and render if includes transactions
      ...Object.keys(priorByYearTransactionList).reduce(
        (
          accum: {
            title: string
            data: TransactionDetails[]
          }[],
          year
        ) => {
          const transactionList = priorByYearTransactionList[year]
          if (transactionList.length > 0) {
            accum.push({ title: year, data: transactionList })
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
    priorByYearTransactionList,
    t,
    todayTransactionList,
    yearTransactionList,
  ])

  const renderItem = useMemo(() => {
    return ({
      item,
      index,
      section,
    }: {
      item: TransactionDetails
      index: number
      section: SectionListData<TransactionDetails>
    }) => {
      // Logic to render border radius and margins on groups of items.
      const aboveItem = index > 0 ? section.data[index - 1] : undefined
      const currentIsIsolated =
        (section.data.length === 1 && item.status === TransactionStatus.Pending) ||
        ((item.status === TransactionStatus.Cancelled ||
          item?.status === TransactionStatus.Cancelling ||
          item?.status === TransactionStatus.FailedCancel) &&
          index === 0 &&
          section.title === TODAY_TITLE(t))
      const aboveIsIsolated =
        (aboveItem?.status === TransactionStatus.Cancelled ||
          aboveItem?.status === TransactionStatus.Cancelling ||
          aboveItem?.status === TransactionStatus.FailedCancel) &&
        index === 1 &&
        section.title === TODAY_TITLE(t)

      const radiusTop = aboveIsIsolated || index === 0
      const radiusBottom = currentIsIsolated || index === section.data.length - 1
      const borderTop = currentIsIsolated
      const borderBottom = currentIsIsolated || index !== section.data.length - 1

      // Only show banner if first element in pending or daily section.
      const showInlineWarning =
        index !== 0 || !(section.title === TODAY_TITLE(t) || section.title === PENDING_TITLE(t))

      return (
        <TransactionSummaryRouter
          borderBottomColor={borderBottom ? 'backgroundOutline' : 'none'}
          borderBottomLeftRadius={radiusBottom ? 'lg' : 'none'}
          borderBottomRightRadius={radiusBottom ? 'lg' : 'none'}
          borderLeftColor={currentIsIsolated ? 'backgroundOutline' : 'none'}
          borderRightColor={currentIsIsolated ? 'backgroundOutline' : 'none'}
          borderTopColor={borderTop ? 'backgroundOutline' : 'none'}
          borderTopLeftRadius={radiusTop ? 'lg' : 'none'}
          borderTopRightRadius={radiusTop ? 'lg' : 'none'}
          borderWidth={0.5}
          mb={currentIsIsolated ? 'md' : 'none'}
          readonly={readonly}
          showInlineWarning={showInlineWarning}
          transaction={item}
        />
      )
    }
  }, [readonly, t])

  if (!hasTransactions) {
    return emptyStateContent
  }

  return (
    <SectionList
      keyExtractor={key}
      renderItem={renderItem}
      renderSectionHeader={SectionTitle}
      sections={sectionData}
    />
  )
}
