import { TradeType } from '@uniswap/sdk-core'
import { expectSaga } from 'redux-saga-test-plan'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { AssetType } from 'uniswap/src/entities/assets'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { NotificationState, pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { finalizeTransaction } from 'uniswap/src/features/transactions/slice'
import {
  ApproveTransactionInfo,
  ExactOutputSwapTransactionInfo,
  ReceiveTokenTransactionInfo,
  SendTokenTransactionInfo,
  TransactionStatus,
  TransactionType,
  TransactionTypeInfo,
  UnknownTransactionInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { finalizedTransactionAction } from 'uniswap/src/test/fixtures'
import { pushTransactionNotification } from 'wallet/src/features/notifications/notificationWatcherSaga'
import { signerMnemonicAccount } from 'wallet/src/test/fixtures'

const finalizedTxAction = finalizedTransactionAction()
const account = signerMnemonicAccount()

const txId = 'uuid-4'

export const createFinalizedTxAction = (typeInfo: TransactionTypeInfo): ReturnType<typeof finalizeTransaction> => ({
  payload: {
    ...finalizedTxAction.payload,
    typeInfo,
    id: txId,
    addedTime: Date.now(),
  },
  type: 'transactions/finalizeTransaction',
})

describe(pushTransactionNotification, () => {
  const initialNotificationsState: NotificationState = {
    notificationQueue: [],
    notificationStatus: {},
    lastTxNotificationUpdate: {},
  }

  it('Handles approve transactions', () => {
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
              uuid2: { typeInfo: TransactionType.Swap, addedTime: Date.now() + 3000 },
            },
          },
        },
        notifications: initialNotificationsState,
        wallet: {
          activeAccountAddress: account.address,
        },
      })
      .put(
        pushNotification({
          txStatus: TransactionStatus.Success,
          address: from,
          chainId,
          type: AppNotificationType.Transaction,
          txType: TransactionType.Approve,
          tokenAddress: approveTypeInfo.tokenAddress,
          spender: approveTypeInfo.spender,
          txId,
        }),
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
        notifications: initialNotificationsState,
        wallet: {
          activeAccountAddress: account.address,
        },
      })
      .silentRun()
  })

  it('Handles swap transactions', () => {
    const swapTypeInfo: ExactOutputSwapTransactionInfo = {
      type: TransactionType.Swap,
      tradeType: TradeType.EXACT_OUTPUT,
      inputCurrencyId: `1-${getNativeAddress(UniverseChainId.Mainnet)}`,
      outputCurrencyId: '1-0x4d224452801ACEd8B2F0aebE155379bb5D594381',
      outputCurrencyAmountRaw: '230000000000000000',
      expectedInputCurrencyAmountRaw: '12000000000000000',
      maximumInputCurrencyAmountRaw: '12000000000000000',
    }
    const finalizedSwapAction = createFinalizedTxAction(swapTypeInfo)
    const { chainId, from } = finalizedSwapAction.payload

    return expectSaga(pushTransactionNotification, finalizedSwapAction)
      .withState({
        notifications: initialNotificationsState,
        wallet: {
          activeAccountAddress: account.address,
        },
      })
      .put(
        pushNotification({
          txStatus: TransactionStatus.Success,
          address: from,
          chainId,
          type: AppNotificationType.Transaction,
          txType: TransactionType.Swap,
          inputCurrencyId: swapTypeInfo.inputCurrencyId,
          outputCurrencyId: swapTypeInfo.outputCurrencyId,
          inputCurrencyAmountRaw: swapTypeInfo.expectedInputCurrencyAmountRaw,
          outputCurrencyAmountRaw: swapTypeInfo.outputCurrencyAmountRaw,
          tradeType: swapTypeInfo.tradeType,
          txId,
        }),
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
    const { chainId, from } = finalizedSendCurrencyAction.payload

    return expectSaga(pushTransactionNotification, finalizedSendCurrencyAction)
      .withState({
        notifications: initialNotificationsState,
        wallet: {
          activeAccountAddress: account.address,
        },
      })
      .put(
        pushNotification({
          txStatus: TransactionStatus.Success,
          address: from,
          chainId,
          type: AppNotificationType.Transaction,
          txType: TransactionType.Send,
          assetType: AssetType.Currency,
          tokenAddress: sendCurrencyTypeInfo.tokenAddress,
          currencyAmountRaw: '1000',
          recipient: sendCurrencyTypeInfo.recipient,
          txId,
        }),
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
    const { chainId, from } = finalizedSendNftAction.payload

    return expectSaga(pushTransactionNotification, finalizedSendNftAction)
      .withState({
        notifications: initialNotificationsState,
        wallet: {
          activeAccountAddress: account.address,
        },
      })
      .put(
        pushNotification({
          txStatus: TransactionStatus.Success,
          address: from,
          chainId,
          type: AppNotificationType.Transaction,
          txType: TransactionType.Send,
          assetType: AssetType.ERC721,
          tokenAddress: sendNftTypeInfo.tokenAddress,
          tokenId: '420',
          recipient: sendNftTypeInfo.recipient,
          txId,
        }),
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
    const { chainId, from } = finalizedReceiveCurrencyAction.payload

    return expectSaga(pushTransactionNotification, finalizedReceiveCurrencyAction)
      .withState({
        notifications: initialNotificationsState,
        wallet: {
          activeAccountAddress: account.address,
        },
      })
      .put(
        pushNotification({
          txStatus: TransactionStatus.Success,
          address: from,
          chainId,
          type: AppNotificationType.Transaction,
          txType: TransactionType.Receive,
          assetType: AssetType.Currency,
          tokenAddress: receiveCurrencyTypeInfo.tokenAddress,
          currencyAmountRaw: '1000',
          sender: receiveCurrencyTypeInfo.sender,
          txId,
        }),
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
    const { chainId, from } = finalizedReceiveNftAction.payload

    return expectSaga(pushTransactionNotification, finalizedReceiveNftAction)
      .withState({
        notifications: initialNotificationsState,
        wallet: {
          activeAccountAddress: account.address,
        },
      })
      .put(
        pushNotification({
          txStatus: TransactionStatus.Success,
          address: from,
          chainId,
          type: AppNotificationType.Transaction,
          txType: TransactionType.Receive,
          assetType: AssetType.ERC1155,
          tokenAddress: receiveNftTypeInfo.tokenAddress,
          tokenId: '420',
          sender: receiveNftTypeInfo.sender,
          txId,
        }),
      )
      .silentRun()
  })

  it('Handles an unknown tranasction', () => {
    const unknownTxTypeInfo: UnknownTransactionInfo = {
      type: TransactionType.Unknown,
      tokenAddress: '0xUniswapToken',
    }
    const finalizedUnknownAction = createFinalizedTxAction(unknownTxTypeInfo)
    const { chainId, from } = finalizedUnknownAction.payload

    return expectSaga(pushTransactionNotification, finalizedUnknownAction)
      .withState({
        notifications: initialNotificationsState,
        wallet: {
          activeAccountAddress: account.address,
        },
      })
      .put(
        pushNotification({
          txStatus: TransactionStatus.Success,
          address: from,
          chainId,
          type: AppNotificationType.Transaction,
          txType: TransactionType.Unknown,
          tokenAddress: unknownTxTypeInfo.tokenAddress,
          txId,
        }),
      )
      .silentRun()
  })
})
