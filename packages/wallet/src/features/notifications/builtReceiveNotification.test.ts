import { ChainId } from 'wallet/src/constants/chains'
import { AssetType } from 'wallet/src/entities/assets'
import { buildReceiveNotification } from 'wallet/src/features/notifications/buildReceiveNotification'
import { createFinalizedTxAction } from 'wallet/src/features/notifications/notificationWatcherSaga.test'
import { AppNotificationType } from 'wallet/src/features/notifications/types'
import {
  ReceiveTokenTransactionInfo,
  TransactionStatus,
  TransactionType,
} from 'wallet/src/features/transactions/types'
import { account, SAMPLE_SEED_ADDRESS_1 } from 'wallet/src/test/fixtures'

const receiveCurrencyTypeInfo: ReceiveTokenTransactionInfo = {
  type: TransactionType.Receive,
  assetType: AssetType.Currency,
  currencyAmountRaw: '1000',
  sender: '0x000123abc456def',
  tokenAddress: '0xUniswapToken',
}

const receiveNftTypeInfo: ReceiveTokenTransactionInfo = {
  type: TransactionType.Receive,
  assetType: AssetType.ERC1155,
  sender: '0x000123abc456def',
  tokenAddress: '0xUniswapToken',
  tokenId: '420',
}

describe(buildReceiveNotification, () => {
  it('returns undefined if not successful status', () => {
    const { payload: testTransaction } = createFinalizedTxAction(receiveCurrencyTypeInfo)
    testTransaction.status = TransactionStatus.Failed // overwite status to incorrect status

    expect(buildReceiveNotification(testTransaction, account.address)).toBeUndefined()
  })

  it('returns undefined if not receive', () => {
    const { payload: testTransaction } = createFinalizedTxAction(receiveCurrencyTypeInfo)
    testTransaction.typeInfo.type = TransactionType.Send // overwite type to incorrect  type

    expect(buildReceiveNotification(testTransaction, account.address)).toBeUndefined()
  })

  it('builds correct notification object for nft receive', () => {
    const { payload: testTransaction } = createFinalizedTxAction(receiveNftTypeInfo)

    expect(buildReceiveNotification(testTransaction, account.address)).toEqual({
      address: SAMPLE_SEED_ADDRESS_1,
      assetType: AssetType.ERC1155,
      chainId: ChainId.Mainnet,
      sender: '0x000123abc456def',
      tokenAddress: '0xUniswapToken',
      tokenId: '420',
      txHash: '0x123',
      txId: 'uuid-4',
      txStatus: TransactionStatus.Success,
      txType: TransactionType.Receive,
      type: AppNotificationType.Transaction,
    })
  })

  it('builds correct notification object for currency receive', () => {
    const { payload: testTransaction } = createFinalizedTxAction(receiveCurrencyTypeInfo)
    testTransaction.typeInfo.type = TransactionType.Receive // overwrite to correct txn type (default is send)

    expect(buildReceiveNotification(testTransaction, account.address)).toEqual({
      address: SAMPLE_SEED_ADDRESS_1,
      assetType: AssetType.Currency,
      chainId: ChainId.Mainnet,
      sender: '0x000123abc456def',
      tokenAddress: '0xUniswapToken',
      txHash: '0x123',
      txId: 'uuid-4',
      txStatus: TransactionStatus.Success,
      txType: TransactionType.Receive,
      type: AppNotificationType.Transaction,
      currencyAmountRaw: '1000',
    })
  })
})
