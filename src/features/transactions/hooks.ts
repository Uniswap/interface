import { skipToken } from '@reduxjs/toolkit/dist/query'
import { TradeType } from '@uniswap/sdk-core'
import dayjs from 'dayjs'
import { useMemo } from 'react'
import { useAppSelector } from 'src/app/hooks'
import { ChainId } from 'src/constants/chains'
import { AssetType, CurrencyAsset } from 'src/entities/assets'
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
import {
  CurrencyField,
  TransactionState,
} from 'src/features/transactions/transactionState/transactionState'
import {
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'src/features/transactions/types'
import { currencyIdToAddress } from 'src/utils/currencyId'
import { logger } from 'src/utils/logger'
import { tryParseRawAmount } from 'src/utils/tryParseAmount'

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

  if (!chainId || !txHash) return undefined

  try {
    if (!transaction) {
      throw new Error(
        `No transaction found for address: ${address}, chainId: ${chainId}, and tx hash ${txHash}`
      )
    }

    const { status: txStatus, typeInfo } = transaction

    if (typeInfo.type !== TransactionType.Swap) {
      throw new Error(
        `Tx hash ${txHash} does not correspond to a swap tx. It is of type ${typeInfo.type}`
      )
    }

    if (txStatus !== TransactionStatus.Failed) {
      throw new Error(`Tx hash ${txHash} does not correspond to a failed tx`)
    }

    if (!inputCurrency) {
      throw new Error(`Could not find a matching currency for currencyId ${inputCurrencyId}`)
    }

    if (!outputCurrency) {
      throw new Error(`Could not find a matching currency for currencyId ${outputCurrencyId}`)
    }

    const inputCurrencyAmountRaw =
      typeInfo.tradeType === TradeType.EXACT_INPUT
        ? typeInfo.inputCurrencyAmountRaw
        : typeInfo.expectedInputCurrencyAmountRaw
    const outputCurrencyAmountRaw =
      typeInfo.tradeType === TradeType.EXACT_OUTPUT
        ? typeInfo.outputCurrencyAmountRaw
        : typeInfo.expectedOutputCurrencyAmountRaw

    const inputAddress = currencyIdToAddress(typeInfo.inputCurrencyId)
    const outputAddress = currencyIdToAddress(typeInfo.outputCurrencyId)

    const inputAsset: CurrencyAsset = {
      address: inputAddress,
      chainId,
      type: AssetType.Currency,
    }

    const outputAsset: CurrencyAsset = {
      address: outputAddress,
      chainId,
      type: AssetType.Currency,
    }

    const exactCurrencyField =
      typeInfo.tradeType === TradeType.EXACT_INPUT ? CurrencyField.INPUT : CurrencyField.OUTPUT

    const exactAmount =
      exactCurrencyField === CurrencyField.INPUT
        ? tryParseRawAmount(inputCurrencyAmountRaw, inputCurrency)
        : tryParseRawAmount(outputCurrencyAmountRaw, outputCurrency)

    const swapFormState: TransactionState = {
      [CurrencyField.INPUT]: inputAsset,
      [CurrencyField.OUTPUT]: outputAsset,
      exactCurrencyField,
      exactAmountToken: exactAmount?.toExact() ?? '',
    }

    return swapFormState
  } catch (error: any) {
    logger.info('hooks', 'useRecreateSwapFormState', error?.message)
    return undefined
  }
}

export interface AllFormattedTransactions {
  combinedTransactionList: TransactionSummaryInfo[]
  todayTransactionList: TransactionSummaryInfo[]
  weekTransactionList: TransactionSummaryInfo[]
  beforeCurrentWeekTransactionList: TransactionSummaryInfo[]
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

  // Segement by current day, current week, and rest.
  const [todayTransactionList, weekTransactionList, beforeCurrentWeekTransactionList, pending] =
    useMemo(() => {
      const msTimestampCutoffDay = dayjs().startOf('day').unix() * 1000 // timestamp in ms for start of day local time
      const msTimestampCutoffWeek = dayjs().subtract(1, 'week').unix() * 1000
      return combinedTransactionList.reduce(
        (accum: TransactionSummaryInfo[][], item) => {
          if (item.status === TransactionStatus.Pending) {
            accum[3].push(item)
          } else if (item.msTimestampAdded > msTimestampCutoffDay) {
            accum[0].push(item)
          } else if (item.msTimestampAdded > msTimestampCutoffWeek) {
            accum[1].push(item)
          } else {
            accum[2].push(item)
          }
          return accum
        },
        [[], [], [], []]
      )
    }, [combinedTransactionList])

  return {
    combinedTransactionList,
    todayTransactionList,
    weekTransactionList,
    beforeCurrentWeekTransactionList,
    pending,
  }
}
