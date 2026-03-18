import { GraphQLApi } from '@universe/api'

export enum FiatOnRampTransactionStatus {
  INITIATED = 'INITIATED',
  PENDING = 'PENDING',
  COMPLETE = 'COMPLETE',
  FAILED = 'FAILED',
}

// eslint-disable-next-line consistent-return
export function backendStatusToFiatOnRampStatus(status: GraphQLApi.TransactionStatus) {
  switch (status) {
    case GraphQLApi.TransactionStatus.Confirmed:
      return FiatOnRampTransactionStatus.COMPLETE
    case GraphQLApi.TransactionStatus.Pending:
      return FiatOnRampTransactionStatus.PENDING
    case GraphQLApi.TransactionStatus.Failed:
      return FiatOnRampTransactionStatus.FAILED
  }
}

export enum FiatOnRampTransactionType {
  BUY = 'BUY',
  SELL = 'SELL',
  TRANSFER = 'TRANSFER',
}
