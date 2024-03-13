import { ChainId } from 'wallet/src/constants/chains'
import { AssetType } from 'wallet/src/entities/assets'
import {
  AppErrorNotification,
  AppNotificationBase,
  AppNotificationDefault,
  AppNotificationType,
  ApproveTxNotification,
  ChangeAssetVisibilityNotification,
  ChooseCountryNotification,
  CopyNotification,
  CopyNotificationType,
  ReceiveCurrencyTxNotification,
  ReceiveNFTNotification,
  ScantasticCompleteNotification,
  SendCurrencyTxNotification,
  SendNFTNotification,
  SuccessNotification,
  SwapNetworkNotification,
  SwapPendingNotification,
  SwapTxNotification,
  TransactionNotificationBase,
  TransferCurrencyPendingNotification,
  TransferCurrencyTxNotificationBase,
  TransferNFTNotificationBase,
  WalletConnectNotification,
  WrapTxNotification,
} from 'wallet/src/features/notifications/types'
import {
  FinalizedTransactionStatus,
  TransactionStatus,
  TransactionType,
  WrapType,
} from 'wallet/src/features/transactions/types'
import { WalletConnectEvent } from 'wallet/src/features/walletConnect/types'
import { currencyInfo } from 'wallet/src/test/fixtures/wallet/currencies'
import { faker } from 'wallet/src/test/shared'
import { createFixture, randomChoice, randomEnumValue } from 'wallet/src/test/utils'

export const FINALIZED_TRANSACTION_STATUSES: FinalizedTransactionStatus[] = [
  TransactionStatus.Success,
  TransactionStatus.Failed,
  TransactionStatus.Canceled,
  TransactionStatus.FailedCancel,
]

const appNotificationBase = createFixture<AppNotificationBase>()(() => ({
  type: randomEnumValue(AppNotificationType),
}))

export const appNotificationDefault = createFixture<AppNotificationDefault>()(() => ({
  ...appNotificationBase(),
  type: AppNotificationType.Default,
  title: faker.lorem.words(),
}))

export const appErrorNotification = createFixture<AppErrorNotification>()(() => ({
  ...appNotificationBase(),
  type: AppNotificationType.Error,
  errorMessage: faker.lorem.words(),
}))

export const walletConnectNotification = createFixture<WalletConnectNotification>()(() => ({
  ...appNotificationBase(),
  type: AppNotificationType.WalletConnect,
  event: randomEnumValue(WalletConnectEvent),
  dappName: faker.lorem.words(),
  imageUrl: faker.image.imageUrl(),
}))

const transactionNotificationBase = createFixture<TransactionNotificationBase>()(() => ({
  ...appNotificationBase(),
  type: AppNotificationType.Transaction,
  txType: randomEnumValue(TransactionType),
  txStatus: randomChoice(FINALIZED_TRANSACTION_STATUSES),
  txHash: faker.datatype.uuid(),
  txId: faker.datatype.uuid(),
  chainId: randomEnumValue(ChainId),
}))

export const approveTxNotification = createFixture<ApproveTxNotification>()(() => ({
  ...transactionNotificationBase(),
  txType: TransactionType.Approve,
  tokenAddress: faker.finance.ethereumAddress(),
  spender: faker.finance.ethereumAddress(),
}))

export const swapTxNotification = createFixture<SwapTxNotification>()(() => ({
  ...transactionNotificationBase(),
  txType: TransactionType.Swap,
  inputCurrencyId: faker.datatype.uuid(),
  outputCurrencyId: faker.datatype.uuid(),
  inputCurrencyAmountRaw: faker.datatype.number().toString(),
  outputCurrencyAmountRaw: faker.datatype.number().toString(),
}))

export const wrapTxNotification = createFixture<WrapTxNotification>()(() => ({
  ...transactionNotificationBase(),
  txType: TransactionType.Wrap,
  currencyAmountRaw: faker.datatype.number().toString(),
  unwrapped: faker.datatype.boolean(),
}))

const transferCurrencyTxNotificationBase = createFixture<TransferCurrencyTxNotificationBase>()(
  () => ({
    ...transactionNotificationBase(),
    txType: randomChoice([TransactionType.Send, TransactionType.Receive]),
    assetType: AssetType.Currency,
    tokenAddress: faker.finance.ethereumAddress(),
    currencyAmountRaw: faker.datatype.number().toString(),
  })
)

export const sendCurrencyTxNotification = createFixture<SendCurrencyTxNotification>()(() => ({
  ...transferCurrencyTxNotificationBase(),
  txType: TransactionType.Send,
  recipient: faker.finance.ethereumAddress(),
}))

export const receiveCurrencyTxNotification = createFixture<ReceiveCurrencyTxNotification>()(() => ({
  ...transferCurrencyTxNotificationBase(),
  txType: TransactionType.Receive,
  sender: faker.finance.ethereumAddress(),
}))

const transferNFTNotificationBase = createFixture<TransferNFTNotificationBase>()(() => ({
  ...transactionNotificationBase(),
  txType: randomChoice([TransactionType.Send, TransactionType.Receive]),
  assetType: randomChoice([AssetType.ERC1155, AssetType.ERC721]),
  tokenAddress: faker.finance.ethereumAddress(),
  tokenId: faker.datatype.uuid(),
}))

export const sendNFTTxNotification = createFixture<SendNFTNotification>()(() => ({
  ...transferNFTNotificationBase(),
  txType: TransactionType.Send,
  recipient: faker.finance.ethereumAddress(),
}))

export const receiveNFTNotification = createFixture<ReceiveNFTNotification>()(() => ({
  ...transferNFTNotificationBase(),
  txType: TransactionType.Receive,
  sender: faker.finance.ethereumAddress(),
}))

export const unknownTxNotification = createFixture<TransactionNotificationBase>()(() => ({
  ...transactionNotificationBase(),
  txType: TransactionType.Unknown,
}))

export const copyNotification = createFixture<CopyNotification>()(() => ({
  ...appNotificationBase(),
  type: AppNotificationType.Copied,
  copyType: randomEnumValue(CopyNotificationType),
}))

export const successNotification = createFixture<SuccessNotification>()(() => ({
  ...appNotificationBase(),
  type: AppNotificationType.Success,
  title: faker.lorem.words(),
}))

export const swapNetworkNotification = createFixture<SwapNetworkNotification>()(() => ({
  ...appNotificationBase(),
  type: AppNotificationType.SwapNetwork,
  chainId: randomEnumValue(ChainId),
}))

export const chooseCountryNotification = createFixture<ChooseCountryNotification>()(() => ({
  ...appNotificationBase(),
  type: AppNotificationType.ChooseCountry,
  countryName: faker.address.country(),
  countryCode: faker.address.countryCode(),
}))

export const changeAssetVisibilityNotifiation = createFixture<ChangeAssetVisibilityNotification>()(
  () => ({
    ...appNotificationBase(),
    type: AppNotificationType.AssetVisibility,
    visible: faker.datatype.boolean(),
    assetName: faker.lorem.words(),
  })
)

export const swapPendingNotification = createFixture<SwapPendingNotification>()(() => ({
  ...appNotificationBase(),
  type: AppNotificationType.SwapPending,
  wrapType: randomEnumValue(WrapType),
}))

export const transferCurrencyPendingNotification =
  createFixture<TransferCurrencyPendingNotification>()(() => ({
    ...appNotificationBase(),
    type: AppNotificationType.TransferCurrencyPending,
    currencyInfo: currencyInfo(),
  }))

export const scantasticCompleteNotification = createFixture<ScantasticCompleteNotification>()(
  () => ({
    ...appNotificationBase(),
    type: AppNotificationType.ScantasticComplete,
  })
)
