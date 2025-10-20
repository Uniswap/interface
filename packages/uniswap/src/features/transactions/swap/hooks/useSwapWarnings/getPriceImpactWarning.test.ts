import { Percent } from '@uniswap/sdk-core'
import i18next from 'i18next'
import { WarningAction, WarningLabel, WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { getPriceImpactWarning } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings/getPriceImpactWarning'
import { CurrencyField } from 'uniswap/src/types/currency'
import { PercentNumberDecimals } from 'utilities/src/format/types'

describe('getPriceImpactWarning', () => {
  const mockTFunction = i18next.t.bind(i18next)

  const mockFormatPercent = (value: Maybe<string | number>, _maxDecimals?: PercentNumberDecimals): string => {
    if (value === undefined || value === null) {
      return '-mocked%'
    }
    return `${value}-mocked%`
  }

  const mockCurrencies = {
    [CurrencyField.INPUT]: {
      currency: { symbol: 'ETH' },
      currencyId: 'ETH',
      logoUrl: null,
    } as CurrencyInfo,
    [CurrencyField.OUTPUT]: {
      currency: { symbol: 'USDC' },
      currencyId: 'USDC',
      logoUrl: null,
    } as CurrencyInfo,
  }

  it('should return undefined when price impact is below medium threshold', () => {
    const priceImpact = new Percent(2, 100) // 2%
    const result = getPriceImpactWarning({
      t: mockTFunction,
      priceImpact,
      formatPercent: mockFormatPercent,
      currencies: mockCurrencies,
    })
    expect(result).toBeUndefined()
  })

  it('should return medium warning when price impact is between medium and high thresholds', () => {
    const priceImpact = new Percent(4, 100) // 4%
    const mockedPriceImpact = `-${mockFormatPercent(priceImpact.toFixed(3))}`
    const result = getPriceImpactWarning({
      t: mockTFunction,
      priceImpact,
      formatPercent: mockFormatPercent,
      currencies: mockCurrencies,
    })

    expect(result).toEqual({
      type: WarningLabel.PriceImpactMedium,
      severity: WarningSeverity.Medium,
      action: WarningAction.WarnBeforeSubmit,
      title: i18next.t('swap.warning.priceImpact.title', { priceImpactValue: mockedPriceImpact }),
      message: i18next.t('swap.warning.priceImpact.message', {
        outputCurrencySymbol: 'USDC',
        inputCurrencySymbol: 'ETH',
      }),
      link: expect.any(String),
    })
  })

  it('should return high warning when price impact is above high threshold', () => {
    const priceImpact = new Percent(6, 100) // 6%
    const mockedPriceImpact = `-${mockFormatPercent(priceImpact.toFixed(3))}`
    const result = getPriceImpactWarning({
      t: mockTFunction,
      priceImpact,
      formatPercent: mockFormatPercent,
      currencies: mockCurrencies,
    })

    expect(result).toEqual({
      type: WarningLabel.PriceImpactHigh,
      severity: WarningSeverity.High,
      action: WarningAction.WarnBeforeSubmit,
      title: i18next.t('swap.warning.priceImpact.title.veryHigh', { priceImpactValue: mockedPriceImpact }),
      message: i18next.t('swap.warning.priceImpact.message.veryHigh', { priceImpactValue: mockedPriceImpact }),
      link: expect.any(String),
    })
  })

  it('should return undefined when price impact is undefined', () => {
    const result = getPriceImpactWarning({
      t: mockTFunction,
      formatPercent: mockFormatPercent,
      currencies: mockCurrencies,
    })
    expect(result).toBeUndefined()
  })
})
