import dayjs from 'dayjs'
import { BigNumber } from 'ethers'
import { parseUnits } from 'ethers/lib/utils'
import { ChainId } from 'src/constants/chains'
import {
  Amount,
  Chain,
  Currency,
  TokenStandard,
  TransactionListQuery,
} from 'src/data/__generated__/types-and-hooks'
import { NativeCurrency } from 'src/features/tokens/NativeCurrency'
import extractTransactionDetails from 'src/features/transactions/history/conversion/extractTransactionDetails'
import {
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'src/features/transactions/types'
import { fromGraphQLChain } from 'src/utils/chainId'
import { getNativeCurrencyAddressForChain } from 'src/utils/currencyId'

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
  const [pending, todayTransactionList, monthTransactionList, beforeCurrentMonth] =
    transactions.reduce<
      [TransactionDetails[], TransactionDetails[], TransactionDetails[], TransactionDetails[]]
    >(
      (accum, item) => {
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
  const pendingSorted = pending.sort((a, b) => {
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
    pending: pendingSorted,
    todayTransactionList,
    monthTransactionList,
    priorByMonthTransactionList,
  }
}

/**
 * Transforms api txn data to formatted TransactionDetails array
 * @param data Transaction history data response
 */
export function parseDataResponseToTransactionDetails(
  data: TransactionListQuery,
  hideSpamTokens?: boolean
): TransactionDetails[] {
  if (data.portfolios?.[0]?.assetActivities) {
    return data.portfolios[0].assetActivities.reduce((accum: TransactionDetails[], t) => {
      const parsed = extractTransactionDetails(t)

      // Filter out spam if desired, currently only for receive transactions
      const isSpam = parsed?.typeInfo.type === TransactionType.Receive && parsed.typeInfo.isSpam

      if (parsed && !(hideSpamTokens && isSpam)) {
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
 * @param quantity // formatted amount of asset transfered
 * @param decimals // decimals ((optional) if native token)
 * @returns
 */
export function deriveCurrencyAmountFromAssetResponse(
  tokenStandard: TokenStandard,
  quantity: string,
  decimals: NullUndefined<number>
): string {
  return parseUnits(
    quantity,
    tokenStandard === TokenStandard.Native
      ? BigNumber.from(NativeCurrency.onChain(ChainId.Mainnet).decimals)
      : decimals
      ? BigNumber.from(decimals)
      : undefined
  ).toString()
}

/**
 * Parses an asset from API and returns either the token address or native currency address
 * for the involved asset.
 * @returns Token address, custom native address or null
 */
export function getAddressFromAsset({
  tokenStandard,
  chain,
  address,
}: {
  tokenStandard: TokenStandard
  chain: Chain | undefined
  address: NullUndefined<string>
}): NullUndefined<string> {
  const supportedChainId = fromGraphQLChain(chain)
  if (!supportedChainId) {
    return null
  }
  if (tokenStandard === TokenStandard.Native) {
    return getNativeCurrencyAddressForChain(supportedChainId)
  }
  return address
}

/**
 *
 * @param transactedValue Transacted value amount from TokenTransfer API response
 * @returns parsed USD value as a number if currency is of type USD
 */
export function parseUSDValueFromAssetChange(
  transactedValue: NullUndefined<Partial<Amount>>
): number | undefined {
  return transactedValue?.currency === Currency.Usd ? transactedValue.value ?? undefined : undefined
}
