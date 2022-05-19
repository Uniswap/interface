import { TradeType } from '@uniswap/sdk-core'
import { ChainId } from 'src/constants/chains'
import { AssetType } from 'src/entities/assets'
import { TransactionStatus, TransactionType } from 'src/features/transactions/types'
import { WalletConnectEvent } from 'src/features/walletConnect/saga'

export enum AppNotificationType {
  Default,
  Error,
  WalletConnect,
  Transaction,
}

interface AppNotificationBase {
  type: AppNotificationType
}

export interface AppNotificationDefault extends AppNotificationBase {
  type: AppNotificationType.Default
  title: string
}

export interface AppErrorNotification extends AppNotificationBase {
  type: AppNotificationType.Error
  errorMessage: string
}
export interface WalletConnectNotification extends AppNotificationBase {
  type: AppNotificationType.WalletConnect
  event: WalletConnectEvent
  dappName: string
  imageUrl: string
  chainId: string
}

export interface TransactionNotificationBase extends AppNotificationBase {
  type: AppNotificationType.Transaction
  txType: TransactionType
  txStatus: TransactionStatus.Success | TransactionStatus.Failed
  txHash: string
  chainId: ChainId
  tokenAddress?: string
}

export interface ApproveTxNotification extends TransactionNotificationBase {
  txType: TransactionType.Approve
  tokenAddress: string
  spender: string
}

export interface SwapTxNotification extends TransactionNotificationBase {
  txType: TransactionType.Swap
  inputCurrencyId: string
  outputCurrencyId: string
  inputCurrencyAmountRaw: string
  outputCurrencyAmountRaw: string
  tradeType: TradeType
}

interface TransferCurrencyTxNotificationBase extends TransactionNotificationBase {
  txType: TransactionType.Send | TransactionType.Receive
  assetType: AssetType.Currency
  tokenAddress: string
  currencyAmountRaw: string
}

export interface SendCurrencyTxNotifcation extends TransferCurrencyTxNotificationBase {
  txType: TransactionType.Send
  recipient: Address
}

export interface ReceiveCurrencyTxNotifcation extends TransferCurrencyTxNotificationBase {
  txType: TransactionType.Receive
  sender: Address
}

interface TransferNFTNotificationBase extends TransactionNotificationBase {
  txType: TransactionType.Send | TransactionType.Receive
  assetType: AssetType.ERC1155 | AssetType.ERC721
  tokenAddress: string
  tokenId: string
}

export interface SendNFTNotification extends TransferNFTNotificationBase {
  txType: TransactionType.Send
  recipient: Address
}

export interface RecieveNFTNotification extends TransferNFTNotificationBase {
  txType: TransactionType.Receive
  sender: Address
}

export interface UnknownTxNotification extends TransactionNotificationBase {
  txType: TransactionType.Unknown
}

export type TransferCurrencyTxNotification =
  | SendCurrencyTxNotifcation
  | ReceiveCurrencyTxNotifcation

export type TransferNFTTxNotification = SendNFTNotification | RecieveNFTNotification

export type TransactionNotification =
  | ApproveTxNotification
  | SwapTxNotification
  | TransferCurrencyTxNotification
  | TransferNFTTxNotification
  | UnknownTxNotification

export type AppNotification =
  | AppNotificationDefault
  | AppErrorNotification
  | WalletConnectNotification
  | TransactionNotification
