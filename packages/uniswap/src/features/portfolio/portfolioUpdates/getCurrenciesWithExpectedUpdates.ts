import { TransactionDetails, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { CurrencyId } from 'uniswap/src/types/currency'
import { buildCurrencyId, buildNativeCurrencyId, buildWrappedNativeCurrencyId } from 'uniswap/src/utils/currencyId'
import { logger } from 'utilities/src/logger/logger'

// based on transaction data, determine which currencies we expect to see a balance update on
export function getCurrenciesWithExpectedUpdates(transaction: TransactionDetails): Set<CurrencyId> | undefined {
  const currenciesWithBalToUpdate: Set<CurrencyId> = new Set()
  const txChainId = transaction.chainId

  // All txs besides FOR at least use gas so check for update of gas token
  currenciesWithBalToUpdate.add(buildNativeCurrencyId(txChainId))

  switch (transaction.typeInfo?.type) {
    case TransactionType.Swap:
    case TransactionType.Bridge:
      currenciesWithBalToUpdate.add(transaction.typeInfo.inputCurrencyId.toLowerCase())
      currenciesWithBalToUpdate.add(transaction.typeInfo.outputCurrencyId.toLowerCase())
      break
    case TransactionType.Send:
      currenciesWithBalToUpdate.add(buildCurrencyId(txChainId, transaction.typeInfo.tokenAddress).toLowerCase())
      break
    case TransactionType.Wrap:
      currenciesWithBalToUpdate.add(buildWrappedNativeCurrencyId(txChainId))
      break
    case TransactionType.OnRampPurchase:
    case TransactionType.OnRampTransfer:
    case TransactionType.OffRampSale:
      currenciesWithBalToUpdate.add(
        buildCurrencyId(txChainId, transaction.typeInfo.destinationTokenAddress).toLowerCase(),
      )
      break
    default:
      logger.info(
        'getCurrenciesWithExpectedUpdates.ts',
        'getCurrenciesWithExpectedUpdates',
        'Unhandled transaction type',
        {
          type: transaction.typeInfo?.type,
          info: JSON.stringify(transaction.typeInfo),
        },
      )
      break
  }

  return currenciesWithBalToUpdate
}
