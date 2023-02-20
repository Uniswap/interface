import {
  GROUP_TRANSACTION_BY_TYPE,
  TRANSACTION_GROUP,
  TRANSACTION_TYPE,
  TransactionDetails,
} from 'state/transactions/type'

export const getTransactionGroupByType = (type: TRANSACTION_TYPE) => {
  if (GROUP_TRANSACTION_BY_TYPE.SWAP.includes(type)) return TRANSACTION_GROUP.SWAP
  if (GROUP_TRANSACTION_BY_TYPE.LIQUIDITY.includes(type)) return TRANSACTION_GROUP.LIQUIDITY
  if (GROUP_TRANSACTION_BY_TYPE.KYBERDAO.includes(type)) return TRANSACTION_GROUP.KYBERDAO
  return TRANSACTION_GROUP.OTHER
}

export const getTransactionStatus = (transaction: TransactionDetails) => {
  const pending = !transaction?.receipt
  const success =
    !pending && transaction && (transaction.receipt?.status === 1 || typeof transaction.receipt?.status === 'undefined')
  return {
    pending,
    success,
    error: !pending && transaction?.receipt?.status !== 1,
  }
}
