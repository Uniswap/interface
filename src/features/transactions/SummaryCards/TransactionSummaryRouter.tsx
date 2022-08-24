import React from 'react'
import { ButtonProps } from 'src/components/buttons/Button'
import ApproveSummaryItem from 'src/features/transactions/SummaryCards/SummaryItems/ApproveSummaryItem'
import NFTApproveSummaryItem from 'src/features/transactions/SummaryCards/SummaryItems/NFTApproveSummaryItem'
import NFTTradeSummaryItem from 'src/features/transactions/SummaryCards/SummaryItems/NFTTradeSummaryItem'
import ReceiveSummaryItem from 'src/features/transactions/SummaryCards/SummaryItems/ReceiveSummaryItem'
import SendSummaryItem from 'src/features/transactions/SummaryCards/SummaryItems/SendSumamryItem'
import SwapSummaryItem from 'src/features/transactions/SummaryCards/SummaryItems/SwapSummaryItem'
import UnknownSummaryItem from 'src/features/transactions/SummaryCards/SummaryItems/UnknownSummaryItem'
import WCSummaryItem from 'src/features/transactions/SummaryCards/SummaryItems/WCSummaryItem'
import WrapSummaryItem from 'src/features/transactions/SummaryCards/SummaryItems/WrapSummaryItem'
import {
  ApproveTransactionInfo,
  ExactInputSwapTransactionInfo,
  ExactOutputSwapTransactionInfo,
  NFTApproveTransactionInfo,
  NFTTradeTransactionInfo,
  ReceiveTokenTransactionInfo,
  SendTokenTransactionInfo,
  TransactionDetails,
  TransactionType,
  UnknownTransactionInfo,
  WCConfirmInfo,
  WrapTransactionInfo,
} from 'src/features/transactions/types'

export const TXN_HISTORY_ICON_SIZE = 36
export const TXN_HISTORY_SIZING = {
  primaryImage: TXN_HISTORY_ICON_SIZE * (2 / 3),
  secondaryImage: TXN_HISTORY_ICON_SIZE * (2 / 3) * (2 / 3),
}

export type BaseTransactionSummaryProps = {
  transaction: TransactionDetails
  showInlineWarning: boolean
  readonly: boolean
} & ButtonProps

export default function TransactionSummaryRouter({
  transaction,
  showInlineWarning,
  ...rest
}: BaseTransactionSummaryProps) {
  switch (transaction.typeInfo.type) {
    case TransactionType.Approve:
      return (
        <ApproveSummaryItem
          transaction={transaction as TransactionDetails & { typeInfo: ApproveTransactionInfo }}
          {...rest}
          showInlineWarning={showInlineWarning}
        />
      )
    case TransactionType.NFTApprove:
      return (
        <NFTApproveSummaryItem
          transaction={transaction as TransactionDetails & { typeInfo: NFTApproveTransactionInfo }}
          {...rest}
          showInlineWarning={showInlineWarning}
        />
      )
    case TransactionType.Swap:
      return (
        <SwapSummaryItem
          transaction={
            transaction as TransactionDetails & {
              typeInfo: ExactOutputSwapTransactionInfo | ExactInputSwapTransactionInfo
            }
          }
          {...rest}
          showInlineWarning={showInlineWarning}
        />
      )
    case TransactionType.NFTTrade:
      return (
        <NFTTradeSummaryItem
          transaction={
            transaction as TransactionDetails & {
              typeInfo: NFTTradeTransactionInfo
            }
          }
          {...rest}
          showInlineWarning={showInlineWarning}
        />
      )
    case TransactionType.Send:
      return (
        <SendSummaryItem
          transaction={
            transaction as TransactionDetails & {
              typeInfo: SendTokenTransactionInfo
            }
          }
          {...rest}
          showInlineWarning={showInlineWarning}
        />
      )
    case TransactionType.Receive:
      return (
        <ReceiveSummaryItem
          transaction={
            transaction as TransactionDetails & {
              typeInfo: ReceiveTokenTransactionInfo
            }
          }
          {...rest}
          showInlineWarning={showInlineWarning}
        />
      )
    case TransactionType.Wrap:
      return (
        <WrapSummaryItem
          transaction={
            transaction as TransactionDetails & {
              typeInfo: WrapTransactionInfo
            }
          }
          {...rest}
          showInlineWarning={showInlineWarning}
        />
      )
    case TransactionType.WCConfirm:
      return (
        <WCSummaryItem
          transaction={
            transaction as TransactionDetails & {
              typeInfo: WCConfirmInfo
            }
          }
          {...rest}
          showInlineWarning={showInlineWarning}
        />
      )
    case TransactionType.Unknown:
      break
  }
  return (
    <UnknownSummaryItem
      transaction={
        transaction as TransactionDetails & {
          typeInfo: UnknownTransactionInfo
        }
      }
      {...rest}
      showInlineWarning={showInlineWarning}
    />
  )
}
