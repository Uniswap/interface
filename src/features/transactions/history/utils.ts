import dayjs from 'dayjs'
import { BigNumber } from 'ethers'
import { parseUnits } from 'ethers/lib/utils'
import { ChainId } from 'src/constants/chains'
import { nativeOnChain } from 'src/constants/tokens'
import {
  Amount,
  Currency,
  Token,
  TokenStandard,
  TransactionListQuery,
} from 'src/data/__generated__/types-and-hooks'
import extractTransactionDetails from 'src/features/transactions/history/conversion/extractTransactionDetails'
import { TransactionDetails, TransactionStatus } from 'src/features/transactions/types'

export interface AllFormattedTransactions {
  combinedTransactionList: TransactionDetails[]
  todayTransactionList: TransactionDetails[]
  monthTransactionList: TransactionDetails[]
  // Maps year <-> TransactionSummaryInfo[] for all months before current month
  priorByMonthTransactionList: Record<string, TransactionDetails[]>
  pending: TransactionDetails[]
}

export function formatTransactionsByDate(
  transactions: TransactionDetails[]
): AllFormattedTransactions {
  // timestamp in ms for start of time periods
  const msTimestampCutoffDay = dayjs().startOf('day').unix() * 1000
  const msTimestampCutoffMonth = dayjs().startOf('month').unix() * 1000
  const msTimestampCutoffYear = dayjs().startOf('year').unix() * 1000

  // Segement by time periods.
  let [pending, todayTransactionList, monthTransactionList, beforeCurrentMonth] =
    transactions.reduce(
      (accum: TransactionDetails[][], item) => {
        if (
          // Want all incomplete transactions
          item.status === TransactionStatus.Pending ||
          item.status === TransactionStatus.Cancelling ||
          item.status === TransactionStatus.Replacing
        ) {
          accum[0].push(item)
        } else if (item.addedTime > msTimestampCutoffDay) {
          accum[1].push(item)
        } else if (item.addedTime > msTimestampCutoffMonth) {
          accum[2].push(item)
        } else {
          accum[3].push(item)
        }
        return accum
      },
      [[], [], [], []]
    )

  // sort pending txns based on nonces
  pending = pending.sort((a, b) => {
    const nonceA = a.options?.request?.nonce
    const nonceB = b.options?.request?.nonce
    return nonceA && nonceB ? (nonceA < nonceB ? -1 : 1) : -1
  })

  // For all transaction before current month, group by month
  const priorByMonthTransactionList = beforeCurrentMonth.reduce(
    (accum: Record<string, TransactionDetails[]>, item) => {
      const isPreviousYear = item.addedTime < msTimestampCutoffYear
      const key = dayjs(item.addedTime)
        // If in a previous year, append year to key string, else just use month
        // This key is used as the section title in TransactionList
        .format(isPreviousYear ? 'MMMM YYYY' : 'MMMM')
        .toString()
      const currentMonthList = accum[key] ?? []
      currentMonthList.push(item)
      accum[key] = currentMonthList
      return accum
    },
    {}
  )

  return {
    combinedTransactionList: transactions,
    pending,
    todayTransactionList,
    monthTransactionList,
    priorByMonthTransactionList,
  }
}

/**
 * Transforms api txn data to formatted TransactionDetails array
 * @param data Transaction history data response
 */
export function parseDataResponseToTransactionDetails(data: TransactionListQuery) {
  if (data.portfolio?.assetActivities) {
    return data.portfolio.assetActivities.reduce((accum: TransactionDetails[], t) => {
      const parsed = extractTransactionDetails(t)
      if (parsed) {
        accum.push(parsed)
      }
      return accum
    }, [])
  }
  return []
}

/**
 * Constructs a CurrencyAmount based on asset details and quantity. Checks if token is native
 * or ERC20 to determine decimal amount.
 * @param tokenStandard token standard type from api query
 * @param asset // asset to use decimals from
 * @param quantity // formatted amount of asset transfered
 * @returns
 */
export function deriveCurrencyAmountFromAssetResponse(
  tokenStandard: TokenStandard,
  asset: Partial<Token>,
  quantity: string
) {
  const nativeCurrency = nativeOnChain(ChainId.Mainnet)
  return parseUnits(
    quantity,
    tokenStandard === 'NATIVE'
      ? BigNumber.from(nativeCurrency.decimals)
      : asset?.decimals
      ? BigNumber.from(asset.decimals)
      : undefined
  ).toString()
}

/**
 *
 * @param transactedValue Transacted value amount from TokenTransfer API response
 * @returns parsed USD value as a number if currency is of type USD
 */
export function parseUSDValueFromAssetChange(transactedValue: NullUndefined<Partial<Amount>>) {
  return transactedValue?.currency === Currency.Usd ? transactedValue.value ?? undefined : undefined
}
