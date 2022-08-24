import dayjs from 'dayjs'
import { BigNumberish } from 'ethers'
import { useMemo } from 'react'
import { useAppSelector } from 'src/app/hooks'
import { ChainId } from 'src/constants/chains'
import { useCurrency } from 'src/features/tokens/useCurrency'
import extractTransactionDetails from 'src/features/transactions/history/conversion/extractTransactionDetails'
import { useTransactionHistoryForOwner } from 'src/features/transactions/history/transactionHistory'
import {
  makeSelectAddressTransactions,
  makeSelectTransaction,
} from 'src/features/transactions/selectors'
import createSwapFromStateFromDetails from 'src/features/transactions/swap/createSwapFromStateFromDetails'
import {
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'src/features/transactions/types'
import { useActiveAccountAddressWithThrow } from 'src/features/wallet/hooks'

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
  combinedTransactionList: TransactionDetails[]
  todayTransactionList: TransactionDetails[]
  monthTransactionList: TransactionDetails[]
  yearTransactionList: TransactionDetails[]
  // Maps year <-> TransactionSummaryInfo[] for all priors years
  priorByYearTransactionList: Record<string, TransactionDetails[]>
  pending: TransactionDetails[]
}

/**
 * @param address Account address for lookup
 * @returns Combined arrays of local and external txns, split into time periods.
 */
export function useAllFormattedTransactions(address: Address): AllFormattedTransactions {
  const remoteTransactions = useTransactionHistoryForOwner(address)
  const localTransactions = useSelectAddressTransactions(address)

  // Merge local and remote txns into array of single type.
  const combinedTransactionList = useMemo(() => {
    if (!address) return []
    const localHashes: Set<string> = new Set()
    localTransactions?.map((t) => {
      localHashes.add(t.hash)
    })
    const formattedRemote = remoteTransactions.assetActivities
      ? remoteTransactions.assetActivities.reduce((accum: TransactionDetails[], t) => {
          const txn = extractTransactionDetails(t)
          if (txn && !localHashes.has(txn.hash)) accum.push(txn) // dedupe
          return accum
        }, [])
      : []
    return (localTransactions ?? [])
      .concat(formattedRemote)
      .sort((a, b) => (a.addedTime > b.addedTime ? -1 : 1))
  }, [address, localTransactions, remoteTransactions.assetActivities])

  // Segement by time periods.
  const [
    pending,
    todayTransactionList,
    monthTransactionList,
    yearTransactionList,
    beforeCurrentYear,
  ] = useMemo(() => {
    const msTimestampCutoffDay = dayjs().startOf('day').unix() // timestamp in ms for start of day local time
    const msTimestampCutoffMonth = dayjs().startOf('month').unix()
    const msTimestampCutoffYear = dayjs().startOf('year').unix()

    const formatted = combinedTransactionList.reduce(
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
        } else if (item.addedTime > msTimestampCutoffYear) {
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
      const nonceA = a.options?.request?.nonce
      const nonceB = b.options?.request?.nonce
      return nonceA && nonceB ? (nonceA < nonceB ? -1 : 1) : -1
    })

    return formatted
  }, [combinedTransactionList])

  // For all transaction before current year, group by years
  const priorByYearTransactionList = useMemo(() => {
    return beforeCurrentYear.reduce((accum: Record<string, TransactionDetails[]>, item) => {
      const currentYear = dayjs(item.addedTime).year().toString()
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
    }
  }, [
    priorByYearTransactionList,
    combinedTransactionList,
    monthTransactionList,
    pending,
    todayTransactionList,
    yearTransactionList,
  ])
}

export function useLowestPendingNonce() {
  const activeAccountAddress = useActiveAccountAddressWithThrow()
  const { pending } = useAllFormattedTransactions(activeAccountAddress)

  return useMemo(() => {
    let min: BigNumberish | undefined
    pending.map((txn) => {
      const currentNonce = txn.options?.request?.nonce
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
  sender: Address,
  recipient: string | undefined | null
): TransactionDetails[] | undefined {
  const txnsToSearch = useAllFormattedTransactions(sender ?? null)
  return useMemo(() => {
    if (!sender || !recipient) return undefined
    return txnsToSearch.combinedTransactionList.filter(
      (tx) => tx.typeInfo.type === TransactionType.Send && tx.typeInfo.recipient === recipient
    )
  }, [recipient, sender, txnsToSearch.combinedTransactionList])
}

// Counts number of transactions from a given sender and to a given recipient
export function useNumTransactionsBetweenAddresses(
  sender: Address,
  recipient: string | undefined | null
): number | undefined {
  const prevTxns = useAllTransactionsBetweenAddresses(sender, recipient)
  return prevTxns?.length
}
