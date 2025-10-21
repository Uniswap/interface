import { TransactionRequest } from '@ethersproject/providers'
import { TradeType } from '@uniswap/sdk-core'
import { Routing } from 'uniswap/src/data/tradingApi/__generated__/index'
import { AssetType } from 'uniswap/src/entities/assets'
import { ALL_EVM_CHAIN_IDS } from 'uniswap/src/features/chains/chainInfo'
import { finalizeTransaction } from 'uniswap/src/features/transactions/slice'
import {
  ApproveTransactionInfo,
  BaseSwapTransactionInfo,
  ClassicTransactionDetails,
  ConfirmedSwapTransactionInfo,
  ExactInputSwapTransactionInfo,
  ExactOutputSwapTransactionInfo,
  FinalizedTransactionDetails,
  LocalOnRampTransactionInfo,
  NFTApproveTransactionInfo,
  NFTMintTransactionInfo,
  NFTSummaryInfo,
  NFTTradeTransactionInfo,
  NFTTradeType,
  ReceiveTokenTransactionInfo,
  SendTokenTransactionInfo,
  TransactionId,
  TransactionOptions,
  TransactionOriginType,
  TransactionReceipt,
  TransactionStatus,
  TransactionType,
  UnknownTransactionInfo,
  WCConfirmInfo,
  WrapTransactionInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { dappInfoWC } from 'uniswap/src/test/fixtures/wallet/walletConnect'
import { faker } from 'uniswap/src/test/shared'
import { createFixture, randomChoice, randomEnumValue } from 'uniswap/src/test/utils'

export const transactionId = createFixture<TransactionId>()(() => ({
  id: faker.datatype.uuid(),
  chainId: randomChoice(ALL_EVM_CHAIN_IDS),
}))

export const nftSummaryInfo = createFixture<NFTSummaryInfo>()(() => ({
  tokenId: faker.datatype.uuid(),
  name: faker.lorem.words(),
  collectionName: faker.lorem.words(),
  imageURL: faker.image.imageUrl(),
  address: faker.finance.ethereumAddress(),
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

export const extractInputSwapTransactionInfo = createFixture<ExactInputSwapTransactionInfo>()(() => ({
  ...baseSwapTransactionInfo(),
  tradeType: TradeType.EXACT_INPUT,
  inputCurrencyAmountRaw: faker.datatype.number().toString(),
  expectedOutputCurrencyAmountRaw: faker.datatype.number().toString(),
  minimumOutputCurrencyAmountRaw: faker.datatype.number().toString(),
}))

export const extractOutputSwapTransactionInfo = createFixture<ExactOutputSwapTransactionInfo>()(() => ({
  ...baseSwapTransactionInfo(),
  tradeType: TradeType.EXACT_OUTPUT,
  outputCurrencyAmountRaw: faker.datatype.number().toString(),
  expectedInputCurrencyAmountRaw: faker.datatype.number().toString(),
  maximumInputCurrencyAmountRaw: faker.datatype.number().toString(),
}))

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

export const fiatPurchaseTransactionInfo = createFixture<LocalOnRampTransactionInfo>()(() => ({
  type: TransactionType.LocalOnRamp,
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
  dappRequestInfo: dappInfoWC(),
}))

export const unknownTransactionInfo = createFixture<UnknownTransactionInfo>()(() => ({
  type: TransactionType.Unknown,
}))

export const transactionOptions = createFixture<TransactionOptions>()(() => ({
  request: {} as TransactionRequest,
}))

export const transactionDetails = createFixture<ClassicTransactionDetails>()(() => ({
  ...transactionId(),
  routing: Routing.CLASSIC,
  from: faker.finance.ethereumAddress(),
  typeInfo: approveTransactionInfo(),
  status: randomEnumValue(TransactionStatus),
  addedTime: faker.date.recent().getTime(),
  options: transactionOptions(),
  transactionOriginType: TransactionOriginType.Internal,
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

export const finalizedTransactionAction = createFixture<ReturnType<typeof finalizeTransaction>>()(() => ({
  payload: finalizedTransactionDetails(),
  type: 'transactions/finalizeTransaction',
}))
