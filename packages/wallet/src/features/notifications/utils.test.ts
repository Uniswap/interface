import { TradeType } from '@uniswap/sdk-core'
import { DAI, USDC } from 'uniswap/src/constants/tokens'
import { Locale } from 'uniswap/src/features/language/constants'
import { TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import { mockLocalizedFormatter } from 'uniswap/src/test/mocks'
import { formSwapNotificationTitle } from 'wallet/src/features/notifications/utils'

const mockFormatter = mockLocalizedFormatter(Locale.EnglishUnitedStates)

describe(formSwapNotificationTitle, () => {
  it('formats successful local swap title', () => {
    expect(
      formSwapNotificationTitle({
        formatter: mockFormatter,
        txStatus: TransactionStatus.Success,
        inputCurrency: DAI,
        outputCurrency: USDC,
        inputCurrencyId: '1-DAI',
        outputCurrencyId: '1-USDC',
        inputCurrencyAmountRaw: '1000000000000000000',
        outputCurrencyAmountRaw: '1000000',
        tradeType: TradeType.EXACT_INPUT,
      }),
    ).toEqual('Swapped 1.00 DAI for ~1.00 USDC.')
  })

  it('formats successful remote swap title', () => {
    expect(
      formSwapNotificationTitle({
        formatter: mockFormatter,
        txStatus: TransactionStatus.Success,
        inputCurrency: DAI,
        outputCurrency: USDC,
        inputCurrencyId: '1-DAI',
        outputCurrencyId: '1-USDC',
        inputCurrencyAmountRaw: '1000000000000000000',
        outputCurrencyAmountRaw: '1200000',
      }),
    ).toEqual('Swapped 1.00 DAI for 1.20 USDC.')
  })

  it('formats canceled swap title', () => {
    expect(
      formSwapNotificationTitle({
        formatter: mockFormatter,
        txStatus: TransactionStatus.Canceled,
        inputCurrency: DAI,
        outputCurrency: USDC,
        inputCurrencyId: '1-DAI',
        outputCurrencyId: '1-USDC',
        inputCurrencyAmountRaw: '1000000000000000000',
        outputCurrencyAmountRaw: '1000000',
        tradeType: TradeType.EXACT_INPUT,
      }),
    ).toEqual('Canceled DAI-USDC swap.')
  })

  it('formats failed swap title', () => {
    expect(
      formSwapNotificationTitle({
        formatter: mockFormatter,
        txStatus: TransactionStatus.Failed,
        inputCurrency: DAI,
        outputCurrency: USDC,
        inputCurrencyId: '1-DAI',
        outputCurrencyId: '1-USDC',
        inputCurrencyAmountRaw: '1000000000000000000',
        outputCurrencyAmountRaw: '1000000',
        tradeType: TradeType.EXACT_INPUT,
      }),
    ).toEqual('Failed to swap 1.00 DAI for ~1.00 USDC.')
  })
})
