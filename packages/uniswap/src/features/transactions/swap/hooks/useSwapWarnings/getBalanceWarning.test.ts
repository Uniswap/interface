import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import i18next from 'i18next'
import { WarningAction, WarningLabel, WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { getBalanceWarning } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings/getBalanceWarning'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { CurrencyField } from 'uniswap/src/types/currency'

jest.mock('utilities/src/platform', () => ({
  isWebPlatform: true,
}))

const MOCK_CURRENCY_ADDRESS = '0x1234567890123456789012345678901234567890'

describe('getBalanceWarning', () => {
  const mockToken = new Token(1, MOCK_CURRENCY_ADDRESS, 18, 'TEST', 'Test Token')
  const mockTFunction = i18next.t.bind(i18next)

  it('should return undefined when balance is sufficient', () => {
    const currencyBalances: DerivedSwapInfo['currencyBalances'] = {
      [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(mockToken, '1000000000000000000'), // 1 token
      [CurrencyField.OUTPUT]: CurrencyAmount.fromRawAmount(mockToken, '1000000000000000000'),
    }

    const currencyAmounts: DerivedSwapInfo['currencyAmounts'] = {
      [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(mockToken, '500000000000000000'), // 0.5 token
      [CurrencyField.OUTPUT]: CurrencyAmount.fromRawAmount(mockToken, '500000000000000000'),
    }

    const result = getBalanceWarning({ t: mockTFunction, currencyBalances, currencyAmounts })
    expect(result).toBeUndefined()
  })

  it('should return warning when balance is insufficient', () => {
    const currencyBalances: DerivedSwapInfo['currencyBalances'] = {
      [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(mockToken, '500000000000000000'), // 0.5 token
      [CurrencyField.OUTPUT]: CurrencyAmount.fromRawAmount(mockToken, '1000000000000000000'),
    }

    const currencyAmounts: DerivedSwapInfo['currencyAmounts'] = {
      [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(mockToken, '1000000000000000000'), // 1 token
      [CurrencyField.OUTPUT]: CurrencyAmount.fromRawAmount(mockToken, '500000000000000000'),
    }

    const result = getBalanceWarning({ t: mockTFunction, currencyBalances, currencyAmounts })
    expect(result).toEqual({
      type: WarningLabel.InsufficientFunds,
      severity: WarningSeverity.None,
      action: WarningAction.DisableReview,
      title: i18next.t('swap.warning.insufficientBalance.title', { currencySymbol: 'TEST' }),
      buttonText: i18next.t('common.insufficientTokenBalance.error.simple', { tokenSymbol: 'TEST' }),
      currency: mockToken,
    })
  })

  it('should handle undefined currency symbol', () => {
    const currencyBalances: DerivedSwapInfo['currencyBalances'] = {
      [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(mockToken, '500000000000000000'),
      [CurrencyField.OUTPUT]: CurrencyAmount.fromRawAmount(mockToken, '1000000000000000000'),
    }

    const currencyAmounts: DerivedSwapInfo['currencyAmounts'] = {
      [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(mockToken, '1000000000000000000'),
      [CurrencyField.OUTPUT]: CurrencyAmount.fromRawAmount(mockToken, '500000000000000000'),
    }

    // Create a token without a symbol
    const tokenWithoutSymbol = new Token(1, MOCK_CURRENCY_ADDRESS, 18, '', 'Test Token')
    currencyAmounts[CurrencyField.INPUT] = CurrencyAmount.fromRawAmount(tokenWithoutSymbol, '1000000000000000000')

    const result = getBalanceWarning({ t: mockTFunction, currencyBalances, currencyAmounts })
    expect(result).toEqual({
      type: WarningLabel.InsufficientFunds,
      severity: WarningSeverity.None,
      action: WarningAction.DisableReview,
      title: i18next.t('swap.warning.insufficientBalance.title', { currencySymbol: '' }),
      buttonText: i18next.t('common.insufficientTokenBalance.error.simple', { tokenSymbol: '' }),
      currency: tokenWithoutSymbol,
    })
  })
})
