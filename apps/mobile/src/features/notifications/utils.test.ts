import { TradeType } from '@uniswap/sdk-core'
import JSBI from 'jsbi'
import { ChainId } from 'src/constants/chains'
import { DAI, USDC } from 'src/constants/tokens'
import { AssetType } from 'src/entities/assets'
import { createFinalizedTxAction } from 'src/features/notifications/notificationWatcher.test'
import { AppNotificationType } from 'src/features/notifications/types'
import {
  buildReceiveNotification,
  convertScientificNotationToNumber,
  createBalanceUpdate,
  formSwapNotificationTitle,
  getCurrencySymbol,
  getFormattedCurrencyAmount,
} from 'src/features/notifications/utils'
import {
  NFTTradeType,
  ReceiveTokenTransactionInfo,
  TransactionStatus,
  TransactionType,
} from 'src/features/transactions/types'
import { account } from 'src/test/fixtures'

describe('convertScientificNotationToNumber', () => {
  it('does not do anything to a regular number', () => {
    expect(convertScientificNotationToNumber('123456')).toBe('123456')
  })

  it('converts a small number', () => {
    expect(convertScientificNotationToNumber('3e-2')).toBe('0.03')
  })

  it('converts a large number', () => {
    expect(convertScientificNotationToNumber('3e+21')).toEqual(
      JSBI.BigInt('3000000000000000000000')
    )
    expect(convertScientificNotationToNumber('3e+2')).toEqual(JSBI.BigInt('300'))
  })

  it('converts a number with decimal places', () => {
    expect(convertScientificNotationToNumber('3.023e10')).toEqual(JSBI.BigInt('30230000000'))
    expect(convertScientificNotationToNumber('1.0254e+22')).toEqual(
      JSBI.BigInt('10254000000000000000000')
    )
  })
})

describe(formSwapNotificationTitle, () => {
  it('formats succesful swap title', () => {
    expect(
      formSwapNotificationTitle(
        TransactionStatus.Success,
        TradeType.EXACT_INPUT,
        DAI,
        USDC,
        '1-DAI',
        '1-USDC',
        '1000000000000000000',
        '1000000'
      )
    ).toEqual('Swapped 1.00 DAI for ~1.00 USDC.')
  })

  it('formats canceled swap title', () => {
    expect(
      formSwapNotificationTitle(
        TransactionStatus.Cancelled,
        TradeType.EXACT_INPUT,
        DAI,
        USDC,
        '1-DAI',
        '1-USDC',
        '1000000000000000000',
        '1000000'
      )
    ).toEqual('Canceled DAI-USDC swap.')
  })

  it('formats failed swap title', () => {
    expect(
      formSwapNotificationTitle(
        TransactionStatus.Failed,
        TradeType.EXACT_INPUT,
        DAI,
        USDC,
        '1-DAI',
        '1-USDC',
        '1000000000000000000',
        '1000000'
      )
    ).toEqual('Failed to swap 1.00 DAI for ~1.00 USDC.')
  })
})

describe(createBalanceUpdate, () => {
  it('handles unconfirmed transactions', () => {
    expect(
      createBalanceUpdate({
        transactionType: TransactionType.Approve,
        transactionStatus: TransactionStatus.Cancelled,
        currency: DAI,
        currencyAmountRaw: '1000000000000000000',
      })
    ).toBeUndefined()

    expect(
      createBalanceUpdate({
        transactionType: TransactionType.Approve,
        transactionStatus: TransactionStatus.Failed,
        currency: DAI,
        currencyAmountRaw: '1000000000000000000',
      })
    ).toBeUndefined()
  })

  it('handles balance increase', () => {
    expect(
      createBalanceUpdate({
        transactionType: TransactionType.Receive,
        transactionStatus: TransactionStatus.Success,
        currency: DAI,
        currencyAmountRaw: '1000000000000000000',
        transactedUSDValue: '1',
      })
    ).toEqual({
      assetValueChange: '+1.00 DAI',
      usdValueChange: '$1.00',
    })
  })

  it('handles balance decrease', () => {
    expect(
      createBalanceUpdate({
        transactionType: TransactionType.Send,
        transactionStatus: TransactionStatus.Success,
        currency: DAI,
        currencyAmountRaw: '1000000000000000000',
        transactedUSDValue: '1',
      })
    ).toEqual({
      assetValueChange: '-1.00 DAI',
      usdValueChange: '$1.00',
    })

    expect(
      createBalanceUpdate({
        transactionType: TransactionType.NFTMint,
        transactionStatus: TransactionStatus.Success,
        currency: DAI,
        currencyAmountRaw: '1000000000000000000',
        transactedUSDValue: '1',
      })
    ).toEqual({
      assetValueChange: '-1.00 DAI',
      usdValueChange: '$1.00',
    })

    expect(
      createBalanceUpdate({
        transactionType: TransactionType.NFTTrade,
        transactionStatus: TransactionStatus.Success,
        nftTradeType: NFTTradeType.BUY,
        currency: DAI,
        currencyAmountRaw: '1000000000000000000',
        transactedUSDValue: '1',
      })
    ).toEqual({
      assetValueChange: '-1.00 DAI',
      usdValueChange: '$1.00',
    })
  })
})

describe(getFormattedCurrencyAmount, () => {
  it('formats valid amount', () => {
    expect(getFormattedCurrencyAmount(DAI, '1000000000000000000')).toEqual('1.00 ')
  })

  it('handles invalid Currency', () => {
    expect(getFormattedCurrencyAmount(undefined, '1')).toEqual('')
    expect(getFormattedCurrencyAmount(null, '1')).toEqual('')
  })

  it('handles error', () => {
    // invalid raw amount will throw error
    expect(getFormattedCurrencyAmount(USDC, '0.1')).toEqual('')
  })
})

describe(getCurrencySymbol, () => {
  it('Returns symbol for token', () => {
    expect(getCurrencySymbol(DAI, DAI.address)).toEqual('DAI')
  })

  it('handles undefined currency with address', () => {
    expect(getCurrencySymbol(undefined, DAI.address)).toEqual('0x6B17...1d0F')
  })

  it('handles undefined address with currency', () => {
    expect(getCurrencySymbol(DAI, undefined)).toEqual('DAI')
  })
})

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
  it('returns undefined if not succesful status', () => {
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
      address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
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
      address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
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
