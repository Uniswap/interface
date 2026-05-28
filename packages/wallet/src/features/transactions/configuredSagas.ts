import { createTransactionSagaDependencies } from 'wallet/src/features/transactions/factories/createTransactionSagaDependencies'
import { TransactionSagaDependencies } from 'wallet/src/features/transactions/types/transactionSagaDependencies'

export const getSharedTransactionSagaDependencies = ((): (() => TransactionSagaDependencies) => {
  let instance: TransactionSagaDependencies | null = null
  return (): TransactionSagaDependencies => {
    if (!instance) {
      instance = createTransactionSagaDependencies()
    }
    return instance
  }
})()
