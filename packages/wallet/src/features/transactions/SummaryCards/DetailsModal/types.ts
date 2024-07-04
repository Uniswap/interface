import {
  ConfirmedSwapTransactionInfo,
  ExactInputSwapTransactionInfo,
  ExactOutputSwapTransactionInfo,
  OnRampPurchaseInfo,
  OnRampTransferInfo,
  UnknownTransactionInfo,
  WrapTransactionInfo,
} from 'wallet/src/features/transactions/types'

export type SwapTypeTransactionInfo =
  | ExactInputSwapTransactionInfo
  | ExactOutputSwapTransactionInfo
  | ConfirmedSwapTransactionInfo

import {
  ApproveTransactionInfo,
  FiatPurchaseTransactionInfo,
  NFTApproveTransactionInfo,
  NFTMintTransactionInfo,
  NFTTradeTransactionInfo,
  ReceiveTokenTransactionInfo,
  SendTokenTransactionInfo,
  TransactionType,
  TransactionTypeInfo,
  WCConfirmInfo,
} from 'wallet/src/features/transactions/types'

export function isApproveTransactionInfo(typeInfo: TransactionTypeInfo): typeInfo is ApproveTransactionInfo {
  return typeInfo.type === TransactionType.Approve
}

export function isFiatPurchaseTransactionInfo(typeInfo: TransactionTypeInfo): typeInfo is FiatPurchaseTransactionInfo {
  return typeInfo.type === TransactionType.FiatPurchase
}

export function isOnRampPurchaseTransactionInfo(typeInfo: TransactionTypeInfo): typeInfo is OnRampPurchaseInfo {
  return typeInfo.type === TransactionType.OnRampPurchase
}

export function isOnRampTransferTransactionInfo(typeInfo: TransactionTypeInfo): typeInfo is OnRampTransferInfo {
  return typeInfo.type === TransactionType.OnRampTransfer
}

export function isNFTApproveTransactionInfo(typeInfo: TransactionTypeInfo): typeInfo is NFTApproveTransactionInfo {
  return typeInfo.type === TransactionType.NFTApprove
}

export function isNFTMintTransactionInfo(typeInfo: TransactionTypeInfo): typeInfo is NFTMintTransactionInfo {
  return typeInfo.type === TransactionType.NFTMint
}

export function isNFTTradeTransactionInfo(typeInfo: TransactionTypeInfo): typeInfo is NFTTradeTransactionInfo {
  return typeInfo.type === TransactionType.NFTTrade
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

export function isWCConfirmTransactionInfo(typeInfo: TransactionTypeInfo): typeInfo is WCConfirmInfo {
  return typeInfo.type === TransactionType.WCConfirm
}

export function isWrapTransactionInfo(typeInfo: TransactionTypeInfo): typeInfo is WrapTransactionInfo {
  return typeInfo.type === TransactionType.Wrap
}

export function isUnknownTransactionInfo(typeInfo: TransactionTypeInfo): typeInfo is UnknownTransactionInfo {
  return typeInfo.type === TransactionType.Unknown
}
