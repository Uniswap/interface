import { TradeType } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { useAppSelector } from 'src/app/hooks'
import { ChainId } from 'src/constants/chains'
import { AssetType, CurrencyAsset } from 'src/entities/assets'
import { useCurrency } from 'src/features/tokens/useCurrency'
import { selectTransactions } from 'src/features/transactions/selectors'
import {
  CurrencyField,
  TransactionState,
} from 'src/features/transactions/transactionState/transactionState'
import { TransactionStatus, TransactionType } from 'src/features/transactions/types'
import { currencyIdToAddress } from 'src/utils/currencyId'
import { logger } from 'src/utils/logger'
import { flattenObjectOfObjects } from 'src/utils/objects'
import { tryParseAmount } from 'src/utils/tryParseAmount'

export function useSortedTransactions(newestFirst = false) {
  const txsByChainId = useAppSelector((state) => state.transactions.byChainId)
  return useMemo(() => {
    const txDetails = flattenObjectOfObjects(txsByChainId)
    return txDetails.sort((a, b) =>
      newestFirst ? b.addedTime - a.addedTime : a.addedTime - b.addedTime
    )
  }, [txsByChainId, newestFirst])
}

export function useCreateSwapFormState(chainId: ChainId, txHash: string) {
  const transactionsByChainId = useAppSelector(selectTransactions)

  const transactions = transactionsByChainId[chainId] ?? {}
  const transaction = Object.values(transactions).find(
    (txDetails) => txDetails.hash.toLowerCase() === txHash.toLowerCase()
  )

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
    if (!Object.values(transactions).length) {
      throw new Error(`No transactions found for chainId ${chainId}`)
    }

    if (!transaction) {
      throw new Error(`No transaction found for tx hash ${txHash}`)
    }

    const { status: txStatus, typeInfo } = transaction

    if (typeInfo.type !== TransactionType.Swap) {
      throw new Error(`Tx hash ${txHash} does not correspond to a swap tx`)
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
        ? tryParseAmount(inputCurrencyAmountRaw, inputCurrency)
        : tryParseAmount(outputCurrencyAmountRaw, outputCurrency)

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
