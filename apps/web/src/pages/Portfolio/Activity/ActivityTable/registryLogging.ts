import { TransactionTypeInfo } from 'uniswap/src/features/transactions/types/transactionDetails'
import { logger } from 'utilities/src/logger/logger'

export const logInvalidTransactionType = (typeInfo: TransactionTypeInfo): void => {
  logger.error(new Error('Invalid transaction type ' + typeInfo.type), {
    tags: {
      file: 'buildActivityRowFragments',
      function: 'buildActivityRowFragmentsInternal',
    },
    extra: {
      typeInfo,
    },
  })
}
