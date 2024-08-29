import { AssetType } from 'uniswap/src/entities/assets'
import {
  ReceiveTokenTransactionInfo,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { receiveTokenTransactionInfo } from 'uniswap/src/test/fixtures'
import { buildReceiveNotification } from 'wallet/src/features/notifications/buildReceiveNotification'
import { createFinalizedTxAction } from 'wallet/src/features/notifications/notificationWatcherSaga.test'
import { receiveCurrencyTxNotification, receiveNFTNotification, signerMnemonicAccount } from 'wallet/src/test/fixtures'

const account = signerMnemonicAccount()

const receiveCurrencyTypeInfo: ReceiveTokenTransactionInfo = receiveTokenTransactionInfo({
  assetType: AssetType.Currency,
})

const receiveNftTypeInfo: ReceiveTokenTransactionInfo = receiveTokenTransactionInfo({
  assetType: AssetType.ERC1155,
  tokenId: '420',
})

describe(buildReceiveNotification, () => {
  it('returns undefined if not successful status', () => {
    const { payload: testTransaction } = createFinalizedTxAction(receiveCurrencyTypeInfo)
    testTransaction.status = TransactionStatus.Failed // overwite status to incorrect status

    expect(buildReceiveNotification(testTransaction, account.address)).toBeUndefined()
  })

  it('returns undefined if not receive', () => {
    const { payload: testTransaction } = createFinalizedTxAction(receiveCurrencyTypeInfo)
    testTransaction.typeInfo.type = TransactionType.Send // overwite type to incorrect type

    expect(buildReceiveNotification(testTransaction, account.address)).toBeUndefined()
  })

  it('builds correct notification object for nft receive', () => {
    const { payload: testTransaction } = createFinalizedTxAction(receiveNftTypeInfo)

    expect(buildReceiveNotification(testTransaction, account.address)).toEqual(
      receiveNFTNotification({
        assetType: AssetType.ERC1155,
        tokenId: receiveNftTypeInfo.tokenId,
        chainId: testTransaction.chainId,
        sender: receiveNftTypeInfo.sender,
        address: account.address,
        tokenAddress: receiveNftTypeInfo.tokenAddress,
        txId: testTransaction.id,
        txStatus: testTransaction.status,
      }),
    )
  })

  it('builds correct notification object for currency receive', () => {
    const { payload: testTransaction } = createFinalizedTxAction(receiveCurrencyTypeInfo)
    testTransaction.typeInfo.type = TransactionType.Receive // overwrite to correct txn type (default is send)

    expect(buildReceiveNotification(testTransaction, account.address)).toEqual(
      receiveCurrencyTxNotification({
        address: account.address,
        chainId: testTransaction.chainId,
        currencyAmountRaw: receiveCurrencyTypeInfo.currencyAmountRaw,
        sender: receiveCurrencyTypeInfo.sender,
        tokenAddress: receiveCurrencyTypeInfo.tokenAddress,
        txId: testTransaction.id,
        txStatus: testTransaction.status,
      }),
    )
  })
})
