import React from 'react'
import { BaseButtonProps } from 'src/components/buttons/TouchableArea'
import ApproveSummaryItem from 'src/features/transactions/SummaryCards/SummaryItems/ApproveSummaryItem'
import FiatPurchaseSummaryItem from 'src/features/transactions/SummaryCards/SummaryItems/FiatPurchaseSummaryItem'
import NFTApproveSummaryItem from 'src/features/transactions/SummaryCards/SummaryItems/NFTApproveSummaryItem'
import NFTMintSummaryItem from 'src/features/transactions/SummaryCards/SummaryItems/NFTMintSummaryItem'
import NFTTradeSummaryItem from 'src/features/transactions/SummaryCards/SummaryItems/NFTTradeSummaryItem'
import ReceiveSummaryItem from 'src/features/transactions/SummaryCards/SummaryItems/ReceiveSummaryItem'
import SendSummaryItem from 'src/features/transactions/SummaryCards/SummaryItems/SendSummaryItem'
import SwapSummaryItem from 'src/features/transactions/SummaryCards/SummaryItems/SwapSummaryItem'
import UnknownSummaryItem from 'src/features/transactions/SummaryCards/SummaryItems/UnknownSummaryItem'
import WCSummaryItem from 'src/features/transactions/SummaryCards/SummaryItems/WCSummaryItem'
import WrapSummaryItem from 'src/features/transactions/SummaryCards/SummaryItems/WrapSummaryItem'
import {
  ApproveTransactionInfo,
  ExactInputSwapTransactionInfo,
  ExactOutputSwapTransactionInfo,
  FiatPurchaseTransactionInfo,
  NFTApproveTransactionInfo,
  NFTMintTransactionInfo,
  NFTTradeTransactionInfo,
  ReceiveTokenTransactionInfo,
  SendTokenTransactionInfo,
  TransactionDetails,
  TransactionType,
  UnknownTransactionInfo,
  WCConfirmInfo,
  WrapTransactionInfo,
} from 'src/features/transactions/types'

export type BaseTransactionSummaryProps = {
  transaction: TransactionDetails
  readonly: boolean
} & BaseButtonProps

export default function TransactionSummaryRouter({
  transaction,
  ...rest
}: BaseTransactionSummaryProps): JSX.Element {
  switch (transaction.typeInfo.type) {
    case TransactionType.Approve:
      return (
        <ApproveSummaryItem
          transaction={transaction as TransactionDetails & { typeInfo: ApproveTransactionInfo }}
          {...rest}
        />
      )
    case TransactionType.NFTApprove:
      return (
        <NFTApproveSummaryItem
          transaction={transaction as TransactionDetails & { typeInfo: NFTApproveTransactionInfo }}
          {...rest}
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
        />
      )
    case TransactionType.NFTMint:
      return (
        <NFTMintSummaryItem
          transaction={
            transaction as TransactionDetails & {
              typeInfo: NFTMintTransactionInfo
            }
          }
          {...rest}
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
        />
      )
    case TransactionType.FiatPurchase:
      return (
        <FiatPurchaseSummaryItem
          transaction={
            transaction as TransactionDetails & { typeInfo: FiatPurchaseTransactionInfo }
          }
          {...rest}
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
    />
  )
}
