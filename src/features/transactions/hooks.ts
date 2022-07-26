import { skipToken } from '@reduxjs/toolkit/dist/query'
import dayjs from 'dayjs'
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
  makeSelectTransactionById,
} from 'src/features/transactions/selectors'
import { TransactionSummaryInfo } from 'src/features/transactions/SummaryCards/TransactionSummaryItem'
import createSwapFromStateFromDetails from 'src/features/transactions/swap/createSwapFromStateFromDetails'
import {
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'src/features/transactions/types'

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
  address: Address | null,
  chainId: ChainId | undefined,
  txHash: string | undefined
) {
  return useAppSelector(makeSelectTransaction(address, chainId, txHash))
}

export function useSelectTransactionById(
  address: Address | undefined,
  chainId: ChainId | undefined,
  txId: string | undefined
): TransactionDetails | undefined {
  return useAppSelector(makeSelectTransactionById(address, chainId, txId))
}

export function useSelectAddressTransactions(address: Address | null) {
  return useAppSelector(makeSelectAddressTransactions(address))
}

export function useCreateSwapFormState(
  address: Address | undefined,
  chainId: ChainId | undefined,
  txHash: string | undefined
) {
  const transaction = useSelectTransaction(address ?? null, chainId, txHash)

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
    if (!chainId || !txHash) return undefined

    return createSwapFromStateFromDetails({
      transactionDetails: transaction,
      inputCurrency,
      outputCurrency,
    })
  }, [chainId, inputCurrency, outputCurrency, transaction, txHash])
}

export interface AllFormattedTransactions {
  combinedTransactionList: TransactionSummaryInfo[]
  todayTransactionList: TransactionSummaryInfo[]
  monthTransactionList: TransactionSummaryInfo[]
  yearTransactionList: TransactionSummaryInfo[]
  beforeCurrentYearTransactionList: TransactionSummaryInfo[]
  pending: TransactionSummaryInfo[]
}

/**
 * @param address Account address for lookup
 * @returns Combined arrays of local and external txns, split into time periods.
 */
export function useAllFormattedTransactions(
  address: string | undefined | null
): AllFormattedTransactions {
  // Retrieve all transactions for account.
  const { currentData: txData } = useTransactionHistoryQuery(
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
    beforeCurrentYearTransactionList,
  ] = useMemo(() => {
    const msTimestampCutoffDay = dayjs().startOf('day').unix() * 1000 // timestamp in ms for start of day local time
    const msTimestampCutoffMonth = dayjs().startOf('month').unix() * 1000
    const msTimestampCutoffYear = dayjs().startOf('year').unix() * 1000
    return combinedTransactionList.reduce(
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
          accum[4].push
        }
        return accum
      },
      [[], [], [], [], []]
    )
  }, [combinedTransactionList])

  return useMemo(() => {
    return {
      combinedTransactionList,
      pending,
      todayTransactionList,
      monthTransactionList,
      yearTransactionList,
      beforeCurrentYearTransactionList,
    }
  }, [
    beforeCurrentYearTransactionList,
    combinedTransactionList,
    monthTransactionList,
    pending,
    todayTransactionList,
    yearTransactionList,
  ])
}
