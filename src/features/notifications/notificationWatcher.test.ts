import { TradeType } from '@uniswap/sdk-core'
import { expectSaga } from 'redux-saga-test-plan'
import { takeLatest } from 'redux-saga/effects'
import { NATIVE_ADDRESS } from 'src/constants/addresses'
import { ChainId } from 'src/constants/chains'
import { AssetType } from 'src/entities/assets'
import { pushNotification } from 'src/features/notifications/notificationSlice'
import {
  notificationWatcher,
  pushTransactionNotification,
} from 'src/features/notifications/notificationWatcher'
import { AppNotificationType } from 'src/features/notifications/types'
import { finalizeTransaction } from 'src/features/transactions/slice'
import {
  ApproveTransactionInfo,
  ExactOutputSwapTransactionInfo,
  ReceiveTokenTransactionInfo,
  SendTokenTransactionInfo,
  TransactionDetails,
  TransactionStatus,
  TransactionType,
  TransactionTypeInfo,
  UnknownTransactionInfo,
} from 'src/features/transactions/types'
import { account, finalizedTxAction, txDetailsPending } from 'src/test/fixtures'

const { address } = account

// Seems to be an issue with testing `takeLatest` from `typed-redux-saga`
describe(notificationWatcher, () => {
  it.skip('Triggers watcher successfully', () => {
    return expectSaga(notificationWatcher)
      .withState({
        transactions: {
          byChainId: {
            [ChainId.Mainnet]: {
              '0': txDetailsPending,
            },
          },
        },
      })
      .dispatch(finalizeTransaction(finalizedTxAction.payload))
      .fork(takeLatest, finalizeTransaction.type, pushTransactionNotification)
      .silentRun()
  })
})

const createTxDetails = (typeInfo: TransactionTypeInfo): TransactionDetails => ({
  chainId: ChainId.Mainnet,
  id: finalizedTxAction.payload.id,
  from: address,
  options: {
    request: {
      from: '0x123',
      to: '0x456',
      value: '0x0',
    },
  },
  typeInfo: typeInfo,
  status: TransactionStatus.Success,
  addedTime: 100,
  hash: '0x01',
})

describe(pushTransactionNotification, () => {
  it('Handles approve transactions', () => {
    const approveTypeInfo: ApproveTransactionInfo = {
      type: TransactionType.Approve,
      tokenAddress: '0xUniswapToken',
      spender: '0xUniswapDeployer',
    }
    const approveTxDetails = createTxDetails(approveTypeInfo)
    const { chainId, id, hash } = approveTxDetails

    return expectSaga(pushTransactionNotification, finalizedTxAction)
      .withState({
        transactions: {
          byChainId: {
            [ChainId.Mainnet]: {
              [id]: approveTxDetails,
            },
          },
        },
      })
      .put(
        pushNotification({
          txStatus: TransactionStatus.Success,
          address,
          chainId,
          txHash: hash,
          type: AppNotificationType.Transaction,
          txType: TransactionType.Approve,
          tokenAddress: approveTypeInfo.tokenAddress,
          spender: approveTypeInfo.spender,
        })
      )
      .silentRun()
  })

  it('Handles swap transactions', () => {
    const swapTypeInfo: ExactOutputSwapTransactionInfo = {
      type: TransactionType.Swap,
      tradeType: TradeType.EXACT_OUTPUT,
      inputCurrencyId: `1-${NATIVE_ADDRESS}`,
      outputCurrencyId: '1-0x4d224452801ACEd8B2F0aebE155379bb5D594381',
      outputCurrencyAmountRaw: '230000000000000000',
      expectedInputCurrencyAmountRaw: '12000000000000000',
      maximumInputCurrencyAmountRaw: '12000000000000000',
    }
    const swapTxDetails = createTxDetails(swapTypeInfo)
    const { chainId, id, hash } = swapTxDetails

    return expectSaga(pushTransactionNotification, finalizedTxAction)
      .withState({
        transactions: {
          byChainId: {
            [ChainId.Mainnet]: {
              [id]: swapTxDetails,
            },
          },
        },
      })
      .put(
        pushNotification({
          txStatus: TransactionStatus.Success,
          address,
          chainId,
          txHash: hash,
          type: AppNotificationType.Transaction,
          txType: TransactionType.Swap,
          inputCurrencyId: swapTypeInfo.inputCurrencyId,
          outputCurrencyId: swapTypeInfo.outputCurrencyId,
          inputCurrencyAmountRaw: swapTypeInfo.expectedInputCurrencyAmountRaw,
          outputCurrencyAmountRaw: swapTypeInfo.outputCurrencyAmountRaw,
          tradeType: swapTypeInfo.tradeType,
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
    const sendCurrencyTxDetails = createTxDetails(sendCurrencyTypeInfo)
    const { chainId, id, hash } = sendCurrencyTxDetails

    return expectSaga(pushTransactionNotification, finalizedTxAction)
      .withState({
        transactions: {
          byChainId: {
            [ChainId.Mainnet]: {
              [id]: sendCurrencyTxDetails,
            },
          },
        },
      })
      .put(
        pushNotification({
          txStatus: TransactionStatus.Success,
          address,
          chainId,
          txHash: hash,
          type: AppNotificationType.Transaction,
          txType: TransactionType.Send,
          assetType: AssetType.Currency,
          tokenAddress: sendCurrencyTypeInfo.tokenAddress,
          currencyAmountRaw: '1000',
          recipient: sendCurrencyTypeInfo.recipient,
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
    const sendNftTxDetails = createTxDetails(sendNftTypeInfo)
    const { chainId, id, hash } = sendNftTxDetails

    return expectSaga(pushTransactionNotification, finalizedTxAction)
      .withState({
        transactions: {
          byChainId: {
            [ChainId.Mainnet]: {
              [id]: sendNftTxDetails,
            },
          },
        },
      })
      .put(
        pushNotification({
          txStatus: TransactionStatus.Success,
          address,
          chainId,
          txHash: hash,
          type: AppNotificationType.Transaction,
          txType: TransactionType.Send,
          assetType: AssetType.ERC721,
          tokenAddress: sendNftTypeInfo.tokenAddress,
          tokenId: '420',
          recipient: sendNftTypeInfo.recipient,
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
    const receiveCurrencyTxDetails = createTxDetails(receiveCurrencyTypeInfo)
    const { chainId, id, hash } = receiveCurrencyTxDetails

    return expectSaga(pushTransactionNotification, finalizedTxAction)
      .withState({
        transactions: {
          byChainId: {
            [ChainId.Mainnet]: {
              [id]: receiveCurrencyTxDetails,
            },
          },
        },
      })
      .put(
        pushNotification({
          txStatus: TransactionStatus.Success,
          address,
          chainId,
          txHash: hash,
          type: AppNotificationType.Transaction,
          txType: TransactionType.Receive,
          assetType: AssetType.Currency,
          tokenAddress: receiveCurrencyTypeInfo.tokenAddress,
          currencyAmountRaw: '1000',
          sender: receiveCurrencyTypeInfo.sender,
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
    const receiveNftTxDetails = createTxDetails(receiveNftTypeInfo)
    const { chainId, id, hash } = receiveNftTxDetails

    return expectSaga(pushTransactionNotification, finalizedTxAction)
      .withState({
        transactions: {
          byChainId: {
            [ChainId.Mainnet]: {
              [id]: receiveNftTxDetails,
            },
          },
        },
      })
      .put(
        pushNotification({
          txStatus: TransactionStatus.Success,
          address,
          chainId,
          txHash: hash,
          type: AppNotificationType.Transaction,
          txType: TransactionType.Receive,
          assetType: AssetType.ERC1155,
          tokenAddress: receiveNftTypeInfo.tokenAddress,
          tokenId: '420',
          sender: receiveNftTypeInfo.sender,
        })
      )
      .silentRun()
  })

  it('Handles an unknown tranasction', () => {
    const unknownTxTypeInfo: UnknownTransactionInfo = {
      type: TransactionType.Unknown,
      tokenAddress: '0xUniswapToken',
    }
    const unknownTxDetails = createTxDetails(unknownTxTypeInfo)
    const { chainId, id, hash } = unknownTxDetails

    return expectSaga(pushTransactionNotification, finalizedTxAction)
      .withState({
        transactions: {
          byChainId: {
            [ChainId.Mainnet]: {
              [id]: unknownTxDetails,
            },
          },
        },
      })
      .put(
        pushNotification({
          txStatus: TransactionStatus.Success,
          address,
          chainId,
          txHash: hash,
          type: AppNotificationType.Transaction,
          txType: TransactionType.Unknown,
          tokenAddress: unknownTxTypeInfo.tokenAddress,
        })
      )
      .silentRun()
  })
})
