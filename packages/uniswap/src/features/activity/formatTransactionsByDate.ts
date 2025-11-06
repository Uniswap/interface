import dayjs from 'dayjs'
import { FORMAT_DATE_MONTH, FORMAT_DATE_MONTH_YEAR, LocalizedDayjs } from 'uniswap/src/features/language/localizedDayjs'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { TransactionDetails, TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'

export interface AllFormattedTransactions {
  todayTransactionList: TransactionDetails[]
  yesterdayTransactionList: TransactionDetails[]
  // Maps year <-> TransactionSummaryInfo[] for all months before current month
  priorByMonthTransactionList: Record<string, TransactionDetails[]>
  pending: TransactionDetails[]
}

export function formatTransactionsByDate(
  transactions: TransactionDetails[] | undefined,
  localizedDayjs: LocalizedDayjs,
): AllFormattedTransactions {
  // timestamp in ms for start of time periods
  const msTimestampCutoffToday = dayjs().startOf('day').valueOf()
  const msTimestampCutoffYesterday = dayjs().subtract(1, 'day').startOf('day').valueOf()
  const msTimestampCutoffYear = dayjs().startOf('year').valueOf()

  // Segment by time periods.
  const [pending, todayTransactionList, yesterdayTransactionList, olderThan24HTransactionList] = (
    transactions ?? []
  ).reduce<[TransactionDetails[], TransactionDetails[], TransactionDetails[], TransactionDetails[]]>(
    (accum, item) => {
      if (
        // Want all incomplete transactions
        item.status === TransactionStatus.Pending ||
        item.status === TransactionStatus.Cancelling ||
        item.status === TransactionStatus.Replacing
      ) {
        accum[0].push(item)
      } else if (item.addedTime >= msTimestampCutoffToday) {
        // Today's transactions
        accum[1].push(item)
      } else if (item.addedTime >= msTimestampCutoffYesterday) {
        // Yesterday's transactions
        accum[2].push(item)
      } else {
        // Older than yesterday
        accum[3].push(item)
      }
      return accum
    },
    [[], [], [], []],
  )

  const pendingSorted = pending.sort((a, b) => {
    // sort based on timestamp if a UniswapxX order is present, since pending UniswapX orders do not have a nonce.
    if (isUniswapX(a) || isUniswapX(b)) {
      return b.addedTime - a.addedTime
    }

    // sort based on nonce if available, highest nonce first for reverse chronological order.
    const nonceA = a.options.request.nonce
    const nonceB = b.options.request.nonce
    return nonceA && nonceB ? (nonceA < nonceB ? 1 : -1) : 1
  })

  // For all transactions before yesterday, group by month
  const priorByMonthTransactionList = olderThan24HTransactionList.reduce(
    (accum: Record<string, TransactionDetails[]>, item) => {
      // Skip transactions with invalid timestamps
      if (!item.addedTime || item.addedTime <= 0) {
        return accum
      }

      const isPreviousYear = item.addedTime < msTimestampCutoffYear
      const dayjsDate = localizedDayjs(item.addedTime)
      const maybeKeyFromDayjsDate = dayjsDate
        // If in a previous year, append year to key string, else just use month
        // This key is used as the section title in TransactionList
        .format(isPreviousYear ? FORMAT_DATE_MONTH_YEAR : FORMAT_DATE_MONTH)
        .toString()

      // Fallback to English if localized formatting fails
      const validatedKey = dayjsDate.isValid()
        ? maybeKeyFromDayjsDate
        : dayjs(item.addedTime)
            .locale('en')
            .format(isPreviousYear ? FORMAT_DATE_MONTH_YEAR : FORMAT_DATE_MONTH)

      const currentMonthList = accum[validatedKey] ?? []
      currentMonthList.push(item)
      accum[validatedKey] = currentMonthList

      return accum
    },
    {},
  )

  return {
    pending: pendingSorted,
    todayTransactionList,
    yesterdayTransactionList,
    priorByMonthTransactionList,
  }
}
