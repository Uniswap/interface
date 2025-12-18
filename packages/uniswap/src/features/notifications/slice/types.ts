import { TradeType } from '@uniswap/sdk-core'
import { AssetType } from 'uniswap/src/entities/assets'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { FinalizedTransactionStatus, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { WalletConnectEvent } from 'uniswap/src/types/walletConnect'

export enum AppNotificationType {
  Default = 0,
  Error = 1,
  WalletConnect = 2,
  Transaction = 3,
  TransactionPending = 4,
  Favorites = 5,
  Copied = 6,
  CopyFailed = 7,
  Success = 8,
  NetworkChanged = 9,
  NetworkChangedBridge = 10,
  ChooseCountry = 11,
  AssetVisibility = 12, // could be token or NFT
  SwapPending = 13,
  TransferCurrencyPending = 14,
  ScantasticComplete = 15,
  DappConnected = 16,
  DappDisconnected = 17,
  NotSupportedNetwork = 18,
  PasswordChanged = 19,
  SmartWalletDisabled = 20,
}

export interface AppNotificationBase {
  type: AppNotificationType
  address?: Address
  hideDelay?: number
  shown?: boolean
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
  imageUrl: Maybe<string>
  chainId?: number
}

export interface TransactionNotificationBase extends AppNotificationBase {
  type: AppNotificationType.Transaction
  txType: TransactionType
  txStatus: FinalizedTransactionStatus
  txId: string
  chainId: UniverseChainId
  tokenAddress?: string
}

export interface ApproveTxNotification extends TransactionNotificationBase {
  txType: TransactionType.Approve
  tokenAddress: string
  spender: string
}

export interface BridgeTxNotification extends TransactionNotificationBase {
  txType: TransactionType.Bridge
  inputCurrencyId: string
  outputCurrencyId: string
  inputCurrencyAmountRaw: string
  outputCurrencyAmountRaw: string
}

export interface SwapTxNotification extends TransactionNotificationBase {
  txType: TransactionType.Swap
  inputCurrencyId: string
  outputCurrencyId: string
  inputCurrencyAmountRaw: string
  outputCurrencyAmountRaw: string
  tradeType?: TradeType
}

export interface WrapTxNotification extends TransactionNotificationBase {
  txType: TransactionType.Wrap
  currencyAmountRaw: string
  unwrapped: boolean
}

export interface TransferCurrencyTxNotificationBase extends TransactionNotificationBase {
  txType: TransactionType.Send | TransactionType.Receive
  assetType: AssetType.Currency
  tokenAddress: string
  currencyAmountRaw: string
}

export interface SendCurrencyTxNotification extends TransferCurrencyTxNotificationBase {
  txType: TransactionType.Send
  recipient: Address
}

export interface ReceiveCurrencyTxNotification extends TransferCurrencyTxNotificationBase {
  txType: TransactionType.Receive
  sender: Address
}

export interface TransferNFTNotificationBase extends TransactionNotificationBase {
  txType: TransactionType.Send | TransactionType.Receive
  assetType: AssetType.ERC1155 | AssetType.ERC721
  tokenAddress: string
  tokenId: string
}

export interface SendNFTNotification extends TransferNFTNotificationBase {
  txType: TransactionType.Send
  recipient: Address
}

export interface ReceiveNFTNotification extends TransferNFTNotificationBase {
  txType: TransactionType.Receive
  sender: Address
}

export interface UnknownTxNotification extends TransactionNotificationBase {
  txType: TransactionType.Unknown
}

export type TransferCurrencyTxNotification = SendCurrencyTxNotification | ReceiveCurrencyTxNotification

export type TransferNFTTxNotification = SendNFTNotification | ReceiveNFTNotification

export type TransactionNotification =
  | ApproveTxNotification
  | BridgeTxNotification
  | SwapTxNotification
  | WrapTxNotification
  | TransferCurrencyTxNotification
  | TransferNFTTxNotification
  | UnknownTxNotification

export enum CopyNotificationType {
  Address = 'address',
  BlockExplorerUrl = 'blockExplorerUrl',
  Calldata = 'calldata',
  ContractAddress = 'contractAddress',
  Image = 'image',
  Message = 'message',
  NftUrl = 'nftUrl',
  TokenUrl = 'tokenUrl',
  TransactionId = 'transactionId',
  Unitag = 'unitag',
}

export interface CopyNotification extends AppNotificationBase {
  type: AppNotificationType.Copied
  copyType: CopyNotificationType
}

export interface CopyFailedNotification extends AppNotificationBase {
  type: AppNotificationType.CopyFailed
  copyType: CopyNotificationType
}

export interface SuccessNotification extends AppNotificationBase {
  type: AppNotificationType.Success
  title: string
}

export interface SmartWalletDisabledNotification extends AppNotificationBase {
  type: AppNotificationType.SmartWalletDisabled
  title: string
}

export interface NetworkChangedNotification extends AppNotificationBase {
  type: AppNotificationType.NetworkChanged
  chainId: UniverseChainId
  flow?: 'swap' | 'send'
}

export interface NetworkChangedBridgeNotification extends AppNotificationBase {
  type: AppNotificationType.NetworkChangedBridge
  fromChainId: UniverseChainId
  toChainId: UniverseChainId
}

export interface ChooseCountryNotification extends AppNotificationBase {
  type: AppNotificationType.ChooseCountry
  countryName: string
  countryCode: string
}

export interface ChangeAssetVisibilityNotification extends AppNotificationBase {
  type: AppNotificationType.AssetVisibility
  visible: boolean
  assetName: string
}

export interface SwapPendingNotification extends AppNotificationBase {
  type: AppNotificationType.SwapPending
  wrapType: WrapType
}

export interface TransferCurrencyPendingNotification extends AppNotificationBase {
  type: AppNotificationType.TransferCurrencyPending
  currencyInfo: CurrencyInfo
}

export interface ScantasticCompleteNotification extends AppNotificationBase {
  type: AppNotificationType.ScantasticComplete
}
export interface DappConnectedNotification extends AppNotificationBase {
  type: AppNotificationType.DappConnected
  dappIconUrl: Maybe<string>
}
export interface DappDisconnectedNotification extends AppNotificationBase {
  type: AppNotificationType.DappDisconnected
  dappIconUrl: Maybe<string>
}

export interface NotSupportedNetworkNotification extends AppNotificationBase {
  type: AppNotificationType.NotSupportedNetwork
}

export interface TransactionPendingNotification extends AppNotificationBase {
  type: AppNotificationType.TransactionPending
  chainId: UniverseChainId
}

export interface PasswordChangedNotification extends AppNotificationBase {
  type: AppNotificationType.PasswordChanged
}

export type AppNotification =
  | AppNotificationDefault
  | AppErrorNotification
  | SwapPendingNotification
  | TransferCurrencyPendingNotification
  | CopyNotification
  | CopyFailedNotification
  | WalletConnectNotification
  | TransactionNotification
  | NetworkChangedNotification
  | NetworkChangedBridgeNotification
  | ChooseCountryNotification
  | ChangeAssetVisibilityNotification
  | SuccessNotification
  | ScantasticCompleteNotification
  | SmartWalletDisabledNotification
  | DappConnectedNotification
  | DappDisconnectedNotification
  | NotSupportedNetworkNotification
  | TransactionPendingNotification
  | PasswordChangedNotification
