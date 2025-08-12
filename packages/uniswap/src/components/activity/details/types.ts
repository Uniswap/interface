import {
  ConfirmedSwapTransactionInfo,
  ExactInputSwapTransactionInfo,
  ExactOutputSwapTransactionInfo,
  LpIncentivesClaimTransactionInfo,
  OffRampSaleInfo,
  OnRampPurchaseInfo,
  ReceiveTokenTransactionInfo,
  SendTokenTransactionInfo,
  TransactionType,
  TransactionTypeInfo,
  UnknownTransactionInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'

export type SwapTypeTransactionInfo =
  | ExactInputSwapTransactionInfo
  | ExactOutputSwapTransactionInfo
  | ConfirmedSwapTransactionInfo

export function isOnRampPurchaseTransactionInfo(typeInfo: TransactionTypeInfo): typeInfo is OnRampPurchaseInfo {
  return typeInfo.type === TransactionType.OnRampPurchase
}

export function isOffRampSaleTransactionInfo(typeInfo: TransactionTypeInfo): typeInfo is OffRampSaleInfo {
  return typeInfo.type === TransactionType.OffRampSale
}

export function isReceiveTokenTransactionInfo(typeInfo: TransactionTypeInfo): typeInfo is ReceiveTokenTransactionInfo {
  return typeInfo.type === TransactionType.Receive
}

export function isSendTokenTransactionInfo(typeInfo: TransactionTypeInfo): typeInfo is SendTokenTransactionInfo {
  return typeInfo.type === TransactionType.Send
}

export function isSwapTransactionInfo(typeInfo: TransactionTypeInfo): typeInfo is SwapTypeTransactionInfo {
  return typeInfo.type === TransactionType.Swap
}

export function isUnknownTransactionInfo(typeInfo: TransactionTypeInfo): typeInfo is UnknownTransactionInfo {
  return typeInfo.type === TransactionType.Unknown
}

export function isLpIncentivesClaimTransactionInfo(
  typeInfo: TransactionTypeInfo,
): typeInfo is LpIncentivesClaimTransactionInfo {
  return typeInfo.type === TransactionType.LPIncentivesClaimRewards
}

export type TransactionParticipantRowProps = {
  onClose: () => void
  address: string
  isSend?: boolean
}
