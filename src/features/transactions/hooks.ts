import { skipToken } from '@reduxjs/toolkit/dist/query'
import dayjs from 'dayjs'
import { BigNumberish } from 'ethers'
import { useMemo } from 'react'
import { useAppSelector } from 'src/app/hooks'
import { ChainId } from 'src/constants/chains'
import { useTransactionHistoryQuery } from 'src/features/dataApi/zerion/api'
import { Namespace } from 'src/features/dataApi/zerion/types'
import { requests } from 'src/features/dataApi/zerion/utils'
import { useCurrency } from 'src/features/tokens/useCurrency'
import { extractTransactionSummaryInfo } from 'src/features/transactions/conversion'
import {
  makeSelectAddressTransactions,
  makeSelectTransaction,
} from 'src/features/transactions/selectors'
import { TransactionSummaryInfo } from 'src/features/transactions/SummaryCards/TransactionSummaryItem'
import createSwapFromStateFromDetails from 'src/features/transactions/swap/createSwapFromStateFromDetails'
import {
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'src/features/transactions/types'
import { useActiveAccountAddress } from 'src/features/wallet/hooks'

// sorted oldest to newest
export function useSortedTransactions(address: Address | null) {
  const transactions = useSelectAddressTransactions(address)

  return useMemo(() => {
    if (!transactions) return
    return transactions.sort((a, b) => a.addedTime - b.addedTime)
  }, [transactions])
}

export function usePendingTransactions(address: Address | null) {
  const transactions = useSelectAddressTransactions(address)
  return useMemo(() => {
    if (!transactions) return
    return transactions.filter((tx) => tx.status === TransactionStatus.Pending)
  }, [transactions])
}

// sorted oldest to newest
export function useSortedPendingTransactions(address: Address | null) {
  const transactions = usePendingTransactions(address)
  return useMemo(() => {
    if (!transactions) return
    return transactions.sort((a, b) => a.addedTime - b.addedTime)
  }, [transactions])
}

export function useSelectTransaction(
  address: Address | undefined,
  chainId: ChainId | undefined,
  txId: string | undefined
): TransactionDetails | undefined {
  return useAppSelector(makeSelectTransaction(address, chainId, txId))
}

export function useSelectAddressTransactions(address: Address | null) {
  return useAppSelector(makeSelectAddressTransactions(address))
}

export function useCreateSwapFormState(
  address: Address | undefined,
  chainId: ChainId | undefined,
  txId: string | undefined
) {
  const transaction = useSelectTransaction(address, chainId, txId)

  const inputCurrencyId =
    transaction?.typeInfo.type === TransactionType.Swap
      ? transaction.typeInfo.inputCurrencyId
      : undefined

  const outputCurrencyId =
    transaction?.typeInfo.type === TransactionType.Swap
      ? transaction.typeInfo.outputCurrencyId
      : undefined

  const inputCurrency = useCurrency(inputCurrencyId)
  const outputCurrency = useCurrency(outputCurrencyId)

  return useMemo(() => {
    if (!chainId || !txId || !transaction) {
      return undefined
    }

    return createSwapFromStateFromDetails({
      transactionDetails: transaction,
      inputCurrency,
      outputCurrency,
    })
  }, [chainId, inputCurrency, outputCurrency, transaction, txId])
}

export interface AllFormattedTransactions {
  combinedTransactionList: TransactionSummaryInfo[]
  todayTransactionList: TransactionSummaryInfo[]
  monthTransactionList: TransactionSummaryInfo[]
  yearTransactionList: TransactionSummaryInfo[]
  // Maps year <-> TransactionSummaryInfo[] for all priors years
  priorByYearTransactionList: Record<string, TransactionSummaryInfo[]>
  pending: TransactionSummaryInfo[]
  loading: boolean
}

/**
 * @param address Account address for lookup
 * @returns Combined arrays of local and external txns, split into time periods.
 */
export function useAllFormattedTransactions(
  address: string | undefined | null
): AllFormattedTransactions {
  // Retrieve all transactions for account.
  const { currentData: txData, isLoading } = useTransactionHistoryQuery(
    address ? requests[Namespace.Address].transactions([address]) : skipToken
  )

  const allTransactionsFromApi = useMemo(
    () => txData?.info?.[address ?? ''] ?? [],
    [address, txData?.info]
  )

  const localTransactions = useSelectAddressTransactions(address ?? null)

  // Merge local and remote txns into array of single type.
  const combinedTransactionList = useMemo(() => {
    const localHashes: Set<string> = new Set()
    const formattedLocal = (localTransactions ?? []).reduce(
      (accum: TransactionSummaryInfo[], t) => {
        localHashes.add(t.hash)
        const txn = extractTransactionSummaryInfo(t)
        accum.push(txn)
        return accum
      },
      []
    )
    const formattedExternal = allTransactionsFromApi.reduce(
      (accum: TransactionSummaryInfo[], t) => {
        const txn = extractTransactionSummaryInfo(t)
        if (!localHashes.has(txn.hash)) accum.push(txn) // dedupe
        return accum
      },
      []
    )
    return formattedLocal
      .concat(formattedExternal)
      .sort((a, b) => (a.msTimestampAdded > b.msTimestampAdded ? -1 : 1))
  }, [allTransactionsFromApi, localTransactions])

  // Segement by time periods.
  const [
    pending,
    todayTransactionList,
    monthTransactionList,
    yearTransactionList,
    beforeCurrentYear,
  ] = useMemo(() => {
    const msTimestampCutoffDay = dayjs().startOf('day').unix() * 1000 // timestamp in ms for start of day local time
    const msTimestampCutoffMonth = dayjs().startOf('month').unix() * 1000
    const msTimestampCutoffYear = dayjs().startOf('year').unix() * 1000
    const formatted = combinedTransactionList.reduce(
      (accum: TransactionSummaryInfo[][], item) => {
        if (
          // Want all incomplete transactions
          item.status === TransactionStatus.Pending ||
          item.status === TransactionStatus.Cancelling ||
          item.status === TransactionStatus.Replacing
        ) {
          accum[0].push(item)
        } else if (item.msTimestampAdded > msTimestampCutoffDay) {
          accum[1].push(item)
        } else if (item.msTimestampAdded > msTimestampCutoffMonth) {
          accum[2].push(item)
        } else if (item.msTimestampAdded > msTimestampCutoffYear) {
          accum[3].push(item)
        } else {
          accum[4].push(item)
        }
        return accum
      },
      [[], [], [], [], []]
    )
    // sort pending txns based on nonces
    formatted[0] = formatted[0].sort((a, b) => {
      const nonceA = a.fullDetails?.options?.request?.nonce
      const nonceB = b.fullDetails?.options?.request?.nonce
      return nonceA && nonceB ? (nonceA < nonceB ? -1 : 1) : -1
    })

    return formatted
  }, [combinedTransactionList])

  // For all transaction before current year, group by years
  const priorByYearTransactionList = useMemo(() => {
    return beforeCurrentYear.reduce((accum: Record<string, TransactionSummaryInfo[]>, item) => {
      const currentYear = dayjs(item.msTimestampAdded).year().toString()
      const currentYearList = accum[currentYear] ?? []
      currentYearList.push(item)
      accum[currentYear] = currentYearList
      return accum
    }, {})
  }, [beforeCurrentYear])

  return useMemo(() => {
    return {
      combinedTransactionList,
      pending,
      todayTransactionList,
      monthTransactionList,
      yearTransactionList,
      priorByYearTransactionList,
      loading: isLoading,
    }
  }, [
    priorByYearTransactionList,
    combinedTransactionList,
    isLoading,
    monthTransactionList,
    pending,
    todayTransactionList,
    yearTransactionList,
  ])
}

export function useLowestPendingNonce() {
  const activeAccountAddress = useActiveAccountAddress()
  const { pending } = useAllFormattedTransactions(activeAccountAddress)

  return useMemo(() => {
    let min: BigNumberish | undefined
    pending.map((txn) => {
      const currentNonce = txn.fullDetails?.options?.request?.nonce
      min = min ? (currentNonce ? (min < currentNonce ? min : currentNonce) : min) : currentNonce
    })
    return min
  }, [pending])
}

/**
 * Gets all transactions from a given sender and to a given recipient
 * @param sender Get all transactions sent by this sender
 * @param recipient Then filter so that we only keep txns to this recipient
 */
export function useAllTransactionsBetweenAddresses(
  sender: string | undefined | null,
  recipient: string | undefined | null
): TransactionSummaryInfo[] | undefined {
  const txnsToSearch = useAllFormattedTransactions(sender)
  return useMemo(() => {
    if (!sender || !recipient) return undefined
    return txnsToSearch.combinedTransactionList.filter(
      (tx) =>
        tx.fullDetails?.typeInfo.type === TransactionType.Send &&
        tx.fullDetails.typeInfo.recipient === recipient
    )
  }, [recipient, sender, txnsToSearch.combinedTransactionList])
}

// Counts number of transactions from a given sender and to a given recipient
export function useNumTransactionsBetweenAddresses(
  sender: string | undefined | null,
  recipient: string | undefined | null
): number | undefined {
  const prevTxns = useAllTransactionsBetweenAddresses(sender, recipient)
  return prevTxns?.length
}
