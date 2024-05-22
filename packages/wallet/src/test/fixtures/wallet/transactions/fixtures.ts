import { TransactionRequest } from '@ethersproject/providers'
import { TradeType } from '@uniswap/sdk-core'
import { ChainId } from 'wallet/src/constants/chains'
import { AssetType } from 'wallet/src/entities/assets'
import { finalizeTransaction } from 'wallet/src/features/transactions/slice'
import {
  ApproveTransactionInfo,
  BaseSwapTransactionInfo,
  ConfirmedSwapTransactionInfo,
  ExactInputSwapTransactionInfo,
  ExactOutputSwapTransactionInfo,
  FiatPurchaseTransactionInfo,
  FinalizedTransactionDetails,
  NFTApproveTransactionInfo,
  NFTMintTransactionInfo,
  NFTSummaryInfo,
  NFTTradeTransactionInfo,
  NFTTradeType,
  ReceiveTokenTransactionInfo,
  SendTokenTransactionInfo,
  TransactionDetails,
  TransactionId,
  TransactionOptions,
  TransactionReceipt,
  TransactionStatus,
  TransactionType,
  UnknownTransactionInfo,
  WCConfirmInfo,
  WrapTransactionInfo,
} from 'wallet/src/features/transactions/types'
import { dappInfoWC } from 'wallet/src/test/fixtures/wallet/walletConnect'
import { faker } from 'wallet/src/test/shared'
import { createFixture, randomEnumValue } from 'wallet/src/test/utils'

export const transactionId = createFixture<TransactionId>()(() => ({
  id: faker.datatype.uuid(),
  chainId: randomEnumValue(ChainId),
}))

export const nftSummaryInfo = createFixture<NFTSummaryInfo>()(() => ({
  tokenId: faker.datatype.uuid(),
  name: faker.lorem.words(),
  collectionName: faker.lorem.words(),
  imageURL: faker.image.imageUrl(),
}))

export const approveTransactionInfo = createFixture<ApproveTransactionInfo>()(() => ({
  type: TransactionType.Approve,
  tokenAddress: faker.finance.ethereumAddress(),
  spender: faker.finance.ethereumAddress(),
}))

export const baseSwapTransactionInfo = createFixture<BaseSwapTransactionInfo>()(() => ({
  type: TransactionType.Swap,
  inputCurrencyId: faker.datatype.uuid(),
  outputCurrencyId: faker.datatype.uuid(),
}))

export const extractInputSwapTransactionInfo = createFixture<ExactInputSwapTransactionInfo>()(
  () => ({
    ...baseSwapTransactionInfo(),
    tradeType: TradeType.EXACT_INPUT,
    inputCurrencyAmountRaw: faker.datatype.number().toString(),
    expectedOutputCurrencyAmountRaw: faker.datatype.number().toString(),
    minimumOutputCurrencyAmountRaw: faker.datatype.number().toString(),
  })
)

export const extractOutputSwapTransactionInfo = createFixture<ExactOutputSwapTransactionInfo>()(
  () => ({
    ...baseSwapTransactionInfo(),
    tradeType: TradeType.EXACT_OUTPUT,
    outputCurrencyAmountRaw: faker.datatype.number().toString(),
    expectedInputCurrencyAmountRaw: faker.datatype.number().toString(),
    maximumInputCurrencyAmountRaw: faker.datatype.number().toString(),
  })
)

export const confirmedSwapTransactionInfo = createFixture<ConfirmedSwapTransactionInfo>()(() => ({
  ...baseSwapTransactionInfo(),
  inputCurrencyAmountRaw: faker.datatype.number().toString(),
  outputCurrencyAmountRaw: faker.datatype.number().toString(),
}))

export const wrapTransactionInfo = createFixture<WrapTransactionInfo>()(() => ({
  type: TransactionType.Wrap,
  unwrapped: faker.datatype.boolean(),
  currencyAmountRaw: faker.datatype.number().toString(),
}))

export const sendTokenTransactionInfo = createFixture<SendTokenTransactionInfo>()(() => ({
  type: TransactionType.Send,
  assetType: randomEnumValue(AssetType),
  recipient: faker.finance.ethereumAddress(),
  tokenAddress: faker.finance.ethereumAddress(),
}))

export const receiveTokenTransactionInfo = createFixture<ReceiveTokenTransactionInfo>()(() => ({
  type: TransactionType.Receive,
  assetType: randomEnumValue(AssetType),
  sender: faker.finance.ethereumAddress(),
  tokenAddress: faker.finance.ethereumAddress(),
  currencyAmountRaw: faker.datatype.number().toString(),
}))

export const fiatPurchaseTransactionInfo = createFixture<FiatPurchaseTransactionInfo>()(() => ({
  type: TransactionType.FiatPurchase,
  syncedWithBackend: faker.datatype.boolean(),
}))

export const nftMintTransactionInfo = createFixture<NFTMintTransactionInfo>()(() => ({
  type: TransactionType.NFTMint,
  nftSummaryInfo: nftSummaryInfo(),
}))

export const nftTradeTransactionInfo = createFixture<NFTTradeTransactionInfo>()(() => ({
  type: TransactionType.NFTTrade,
  nftSummaryInfo: nftSummaryInfo(),
  purchaseCurrencyId: faker.datatype.uuid(),
  purchaseCurrencyAmountRaw: faker.datatype.number().toString(),
  tradeType: randomEnumValue(NFTTradeType),
}))

export const nftApproveTransactionInfo = createFixture<NFTApproveTransactionInfo>()(() => ({
  type: TransactionType.NFTApprove,
  nftSummaryInfo: nftSummaryInfo(),
  spender: faker.finance.ethereumAddress(),
}))

export const wcConfirmInfo = createFixture<WCConfirmInfo>()(() => ({
  type: TransactionType.WCConfirm,
  dapp: dappInfoWC(),
}))

export const unknownTransactionInfo = createFixture<UnknownTransactionInfo>()(() => ({
  type: TransactionType.Unknown,
}))

export const transactionOptions = createFixture<TransactionOptions>()(() => ({
  request: {} as TransactionRequest,
}))

export const transactionDetails = createFixture<TransactionDetails>()(() => ({
  ...transactionId(),
  from: faker.finance.ethereumAddress(),
  typeInfo: approveTransactionInfo(),
  status: randomEnumValue(TransactionStatus),
  addedTime: faker.date.recent().getTime(),
  options: transactionOptions(),
}))

export const finalizedTransactionDetails = createFixture<FinalizedTransactionDetails>()(() => ({
  ...transactionDetails(),
  hash: faker.datatype.uuid(),
  // Successful by default
  status: TransactionStatus.Success,
  receipt: transactionReceipt(),
}))

export const transactionReceipt = createFixture<TransactionReceipt>()(() => ({
  transactionIndex: faker.datatype.number(),
  blockNumber: faker.datatype.number(),
  blockHash: faker.datatype.uuid(),
  confirmedTime: faker.date.recent().getTime(),
  confirmations: faker.datatype.number(),
  gasUsed: faker.datatype.number(),
  effectiveGasPrice: faker.datatype.number(),
}))

export const finalizedTransactionAction = createFixture<ReturnType<typeof finalizeTransaction>>()(
  () => ({
    payload: finalizedTransactionDetails(),
    type: 'transactions/finalizeTransaction',
  })
)
