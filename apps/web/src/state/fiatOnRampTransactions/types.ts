import { TransactionStatus } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

export enum FiatOnRampTransactionStatus {
  INITIATED = 'INITIATED',
  PENDING = 'PENDING',
  COMPLETE = 'COMPLETE',
  FAILED = 'FAILED',
}

// eslint-disable-next-line consistent-return
export function backendStatusToFiatOnRampStatus(status: TransactionStatus) {
  switch (status) {
    case TransactionStatus.Confirmed:
      return FiatOnRampTransactionStatus.COMPLETE
    case TransactionStatus.Pending:
      return FiatOnRampTransactionStatus.PENDING
    case TransactionStatus.Failed:
      return FiatOnRampTransactionStatus.FAILED
  }
}

export enum FiatOnRampTransactionType {
  BUY = 'BUY',
  TRANSFER = 'TRANSFER',
}
