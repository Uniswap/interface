import { TradeType } from '@uniswap/sdk-core'
import { expectSaga } from 'redux-saga-test-plan'
import { getNativeAddress } from 'wallet/src/constants/addresses'
import { ChainId } from 'wallet/src/constants/chains'
import { AssetType } from 'wallet/src/entities/assets'
import { pushTransactionNotification } from 'wallet/src/features/notifications/notificationWatcherSaga'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType } from 'wallet/src/features/notifications/types'
import { finalizeTransaction } from 'wallet/src/features/transactions/slice'
import {
  ApproveTransactionInfo,
  ExactOutputSwapTransactionInfo,
  ReceiveTokenTransactionInfo,
  SendTokenTransactionInfo,
  TransactionStatus,
  TransactionType,
  TransactionTypeInfo,
  UnknownTransactionInfo,
} from 'wallet/src/features/transactions/types'
import { finalizedTransactionAction } from 'wallet/src/test/fixtures'

const finalizedTxAction = finalizedTransactionAction()

const txId = 'uuid-4'

export const createFinalizedTxAction = (
  typeInfo: TransactionTypeInfo
): ReturnType<typeof finalizeTransaction> => ({
  payload: {
    ...finalizedTxAction.payload,
    typeInfo,
    id: txId,
  },
  type: 'transactions/finalizeTransaction',
})

describe(pushTransactionNotification, () => {
  it('Handles approve transactions', () => {
    const approveTypeInfo: ApproveTransactionInfo = {
      type: TransactionType.Approve,
      tokenAddress: '0xUniswapToken',
      spender: '0xUniswapDeployer',
    }
    const finalizedApproveAction = createFinalizedTxAction(approveTypeInfo)
    const { chainId, from, hash } = finalizedApproveAction.payload

    return expectSaga(pushTransactionNotification, finalizedApproveAction)
      .withState({
        transactions: {
          [from]: {
            [chainId]: {
              uuid1: { typeInfo: TransactionType.Approve, addedTime: Date.now() },
              uuid2: { typeInfo: TransactionType.Swap, addedTime: Date.now() + 3000 },
            },
          },
        },
      })
      .put(
        pushNotification({
          txStatus: TransactionStatus.Success,
          address: from,
          chainId,
          txHash: hash,
          type: AppNotificationType.Transaction,
          txType: TransactionType.Approve,
          tokenAddress: approveTypeInfo.tokenAddress,
          spender: approveTypeInfo.spender,
          txId,
        })
      )
      .silentRun()
  })

  it('Suppresses approve notification if a swap was also submited within 3 seconds', () => {
    const approveTypeInfo: ApproveTransactionInfo = {
      type: TransactionType.Approve,
      tokenAddress: '0xUniswapToken',
      spender: '0xUniswapDeployer',
    }
    const finalizedApproveAction = createFinalizedTxAction(approveTypeInfo)
    const { chainId, from } = finalizedApproveAction.payload

    return expectSaga(pushTransactionNotification, finalizedApproveAction)
      .withState({
        transactions: {
          [from]: {
            [chainId]: {
              uuid1: { typeInfo: TransactionType.Approve, addedTime: Date.now() },
              uuid2: { typeInfo: TransactionType.Swap, addedTime: Date.now() + 2000 },
            },
          },
        },
      })
      .silentRun()
  })

  it('Handles swap transactions', () => {
    const swapTypeInfo: ExactOutputSwapTransactionInfo = {
      type: TransactionType.Swap,
      tradeType: TradeType.EXACT_OUTPUT,
      inputCurrencyId: `1-${getNativeAddress(ChainId.Mainnet)}`,
      outputCurrencyId: '1-0x4d224452801ACEd8B2F0aebE155379bb5D594381',
      outputCurrencyAmountRaw: '230000000000000000',
      expectedInputCurrencyAmountRaw: '12000000000000000',
      maximumInputCurrencyAmountRaw: '12000000000000000',
    }
    const finalizedSwapAction = createFinalizedTxAction(swapTypeInfo)
    const { chainId, from, hash } = finalizedSwapAction.payload

    return expectSaga(pushTransactionNotification, finalizedSwapAction)
      .put(
        pushNotification({
          txStatus: TransactionStatus.Success,
          address: from,
          chainId,
          txHash: hash,
          type: AppNotificationType.Transaction,
          txType: TransactionType.Swap,
          inputCurrencyId: swapTypeInfo.inputCurrencyId,
          outputCurrencyId: swapTypeInfo.outputCurrencyId,
          inputCurrencyAmountRaw: swapTypeInfo.expectedInputCurrencyAmountRaw,
          outputCurrencyAmountRaw: swapTypeInfo.outputCurrencyAmountRaw,
          tradeType: swapTypeInfo.tradeType,
          txId,
        })
      )
      .silentRun()
  })

  it('Handles sending currency', () => {
    const sendCurrencyTypeInfo: SendTokenTransactionInfo = {
      type: TransactionType.Send,
      assetType: AssetType.Currency,
      currencyAmountRaw: '1000',
      recipient: '0x123abc456def',
      tokenAddress: '0xUniswapToken',
    }
    const finalizedSendCurrencyAction = createFinalizedTxAction(sendCurrencyTypeInfo)
    const { chainId, from, hash } = finalizedSendCurrencyAction.payload

    return expectSaga(pushTransactionNotification, finalizedSendCurrencyAction)
      .put(
        pushNotification({
          txStatus: TransactionStatus.Success,
          address: from,
          chainId,
          txHash: hash,
          type: AppNotificationType.Transaction,
          txType: TransactionType.Send,
          assetType: AssetType.Currency,
          tokenAddress: sendCurrencyTypeInfo.tokenAddress,
          currencyAmountRaw: '1000',
          recipient: sendCurrencyTypeInfo.recipient,
          txId,
        })
      )
      .silentRun()
  })

  it('Handles sending NFTs', () => {
    const sendNftTypeInfo: SendTokenTransactionInfo = {
      type: TransactionType.Send,
      assetType: AssetType.ERC721,
      recipient: '0x123abc456def',
      tokenAddress: '0xUniswapToken',
      tokenId: '420',
    }
    const finalizedSendNftAction = createFinalizedTxAction(sendNftTypeInfo)
    const { chainId, from, hash } = finalizedSendNftAction.payload

    return expectSaga(pushTransactionNotification, finalizedSendNftAction)
      .put(
        pushNotification({
          txStatus: TransactionStatus.Success,
          address: from,
          chainId,
          txHash: hash,
          type: AppNotificationType.Transaction,
          txType: TransactionType.Send,
          assetType: AssetType.ERC721,
          tokenAddress: sendNftTypeInfo.tokenAddress,
          tokenId: '420',
          recipient: sendNftTypeInfo.recipient,
          txId,
        })
      )
      .silentRun()
  })

  it('Handles receiving currency', () => {
    const receiveCurrencyTypeInfo: ReceiveTokenTransactionInfo = {
      type: TransactionType.Receive,
      assetType: AssetType.Currency,
      currencyAmountRaw: '1000',
      sender: '0x000123abc456def',
      tokenAddress: '0xUniswapToken',
    }
    const finalizedReceiveCurrencyAction = createFinalizedTxAction(receiveCurrencyTypeInfo)
    const { chainId, from, hash } = finalizedReceiveCurrencyAction.payload

    return expectSaga(pushTransactionNotification, finalizedReceiveCurrencyAction)
      .put(
        pushNotification({
          txStatus: TransactionStatus.Success,
          address: from,
          chainId,
          txHash: hash,
          type: AppNotificationType.Transaction,
          txType: TransactionType.Receive,
          assetType: AssetType.Currency,
          tokenAddress: receiveCurrencyTypeInfo.tokenAddress,
          currencyAmountRaw: '1000',
          sender: receiveCurrencyTypeInfo.sender,
          txId,
        })
      )
      .silentRun()
  })

  it('Handles receiving NFTs', () => {
    const receiveNftTypeInfo: ReceiveTokenTransactionInfo = {
      type: TransactionType.Receive,
      assetType: AssetType.ERC1155,
      sender: '0x000123abc456def',
      tokenAddress: '0xUniswapToken',
      tokenId: '420',
    }
    const finalizedReceiveNftAction = createFinalizedTxAction(receiveNftTypeInfo)
    const { chainId, from, hash } = finalizedReceiveNftAction.payload

    return expectSaga(pushTransactionNotification, finalizedReceiveNftAction)
      .put(
        pushNotification({
          txStatus: TransactionStatus.Success,
          address: from,
          chainId,
          txHash: hash,
          type: AppNotificationType.Transaction,
          txType: TransactionType.Receive,
          assetType: AssetType.ERC1155,
          tokenAddress: receiveNftTypeInfo.tokenAddress,
          tokenId: '420',
          sender: receiveNftTypeInfo.sender,
          txId,
        })
      )
      .silentRun()
  })

  it('Handles an unknown tranasction', () => {
    const unknownTxTypeInfo: UnknownTransactionInfo = {
      type: TransactionType.Unknown,
      tokenAddress: '0xUniswapToken',
    }
    const finalizedUnknownAction = createFinalizedTxAction(unknownTxTypeInfo)
    const { chainId, from, hash } = finalizedUnknownAction.payload

    return expectSaga(pushTransactionNotification, finalizedUnknownAction)
      .put(
        pushNotification({
          txStatus: TransactionStatus.Success,
          address: from,
          chainId,
          txHash: hash,
          type: AppNotificationType.Transaction,
          txType: TransactionType.Unknown,
          tokenAddress: unknownTxTypeInfo.tokenAddress,
          txId,
        })
      )
      .silentRun()
  })
})
