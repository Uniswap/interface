import { TradeType } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { useAppSelector } from 'src/app/hooks'
import { ChainId } from 'src/constants/chains'
import { AssetType, CurrencyAsset } from 'src/entities/assets'
import { useCurrency } from 'src/features/tokens/useCurrency'
import {
  makeSelectAddressTransactions,
  makeSelectTransaction,
} from 'src/features/transactions/selectors'
import {
  CurrencyField,
  TransactionState,
} from 'src/features/transactions/transactionState/transactionState'
import { TransactionStatus, TransactionType } from 'src/features/transactions/types'
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

export function useSelectTransaction(address: Address | null, chainId: ChainId, txHash: string) {
  return useAppSelector(
    useMemo(() => makeSelectTransaction(address, chainId, txHash), [address, chainId, txHash])
  )
}

export function useSelectAddressTransactions(address: Address | null) {
  return useAppSelector(useMemo(() => makeSelectAddressTransactions(address), [address]))
}

export function useCreateSwapFormState(
  address: Address | undefined,
  chainId: ChainId,
  txHash: string
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
      exactAmount: exactAmount?.toExact() ?? '',
    }

    return swapFormState
  } catch (error: any) {
    logger.info('hooks', 'useRecreateSwapFormState', error?.message)
    return null
  }
}
