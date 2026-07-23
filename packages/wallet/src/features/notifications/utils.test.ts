import { TradeType } from '@uniswap/sdk-core'
import { DAI, USDC } from 'uniswap/src/constants/tokens'
import { Locale } from 'uniswap/src/features/language/constants'
import { TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import { mockLocalizedFormatter } from 'uniswap/src/test/mocks'
import { formSwapNotificationTitle } from 'wallet/src/features/notifications/utils'

// Echo the i18n key and the interpolation values so both the key selection and the
// amount/symbol formatting stay covered without depending on real translations
vi.mock('uniswap/src/i18n', () => ({
  default: {
    t: (key: string, options?: Record<string, unknown>): string => [key, ...Object.values(options ?? {})].join('|'),
  },
}))

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
    ).toEqual('notification.transaction.swap.success|1.00 DAI|~1.00 USDC')
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
    ).toEqual('notification.transaction.swap.success|1.00 DAI|1.20 USDC')
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
    ).toEqual('notification.transaction.swap.canceled|DAI|USDC')
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
    ).toEqual('notification.transaction.swap.fail|1.00 DAI|~1.00 USDC')
  })

  it('formats expired swap title', () => {
    expect(
      formSwapNotificationTitle({
        formatter: mockFormatter,
        txStatus: TransactionStatus.Expired,
        inputCurrency: DAI,
        outputCurrency: USDC,
        inputCurrencyId: '1-DAI',
        outputCurrencyId: '1-USDC',
        inputCurrencyAmountRaw: '1000000000000000000',
        outputCurrencyAmountRaw: '1000000',
        tradeType: TradeType.EXACT_INPUT,
      }),
    ).toEqual('notification.transaction.swap.expired|1.00 DAI|~1.00 USDC')
  })
})
