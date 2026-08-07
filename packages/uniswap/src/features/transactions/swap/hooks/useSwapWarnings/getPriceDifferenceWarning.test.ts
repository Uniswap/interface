import { Percent } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import i18next from 'i18next'
import { AlertTriangleFilled } from 'ui/src/components/icons'
import { WarningAction, WarningLabel, WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { getPriceDifferenceWarning } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings/getPriceDifferenceWarning'
import { PercentNumberDecimals } from 'utilities/src/format/types'

describe('getPriceDifferenceWarning', () => {
  const mockTFunction = i18next.t.bind(i18next)

  const mockFormatPercent = (value: Maybe<string | number>, _maxDecimals?: PercentNumberDecimals): string => {
    if (value === undefined || value === null) {
      return '-mocked%'
    }
    return `${value}-mocked%`
  }

  it('should return undefined when the price difference is below medium threshold', () => {
    const priceDifference = new Percent(2, 100) // 2%
    const result = getPriceDifferenceWarning({
      t: mockTFunction,
      priceDifference,
      formatPercent: mockFormatPercent,
    })
    expect(result).toBeUndefined()
  })

  it('should return medium warning when the price difference is between medium and high thresholds', () => {
    const priceDifference = new Percent(7, 100) // 7%
    const mockedPriceImpact = mockFormatPercent(priceDifference.toFixed(3))
    const result = getPriceDifferenceWarning({
      t: mockTFunction,
      priceDifference,
      formatPercent: mockFormatPercent,
    })

    expect(result).toEqual({
      type: WarningLabel.PriceDifferenceMedium,
      severity: WarningSeverity.Medium,
      action: WarningAction.WarnBeforeSubmit,
      icon: AlertTriangleFilled,
      title: i18next.t('swap.warning.priceImpact.title', { priceImpactValue: mockedPriceImpact }),
      message: i18next.t('swap.warning.priceImpact.message', {
        priceImpactValue: mockedPriceImpact,
      }),
      link: expect.any(String),
    })
  })

  it('should return high warning when the price difference is above high threshold', () => {
    const priceDifference = new Percent(12, 100) // 12%
    const mockedPriceImpact = mockFormatPercent(priceDifference.toFixed(3))
    const result = getPriceDifferenceWarning({
      t: mockTFunction,
      priceDifference,
      formatPercent: mockFormatPercent,
    })

    expect(result).toEqual({
      type: WarningLabel.PriceDifferenceHigh,
      severity: WarningSeverity.High,
      action: WarningAction.WarnBeforeSubmit,
      icon: AlertTriangleFilled,
      title: i18next.t('swap.warning.priceImpact.title', { priceImpactValue: mockedPriceImpact }),
      message: i18next.t('swap.warning.priceImpact.message', {
        priceImpactValue: mockedPriceImpact,
      }),
      link: expect.any(String),
    })
  })

  it('should return undefined when the price difference is undefined', () => {
    const result = getPriceDifferenceWarning({
      t: mockTFunction,
      formatPercent: mockFormatPercent,
    })
    expect(result).toBeUndefined()
  })

  it('uses the standard thresholds for classic routing', () => {
    const priceDifference = new Percent(7, 100) // 7%
    const result = getPriceDifferenceWarning({
      t: mockTFunction,
      priceDifference,
      routing: TradingApi.Routing.CLASSIC,
      formatPercent: mockFormatPercent,
    })
    expect(result?.type).toBe(WarningLabel.PriceDifferenceMedium)
  })

  describe('chained routing', () => {
    const getWarning = (numerator: number, denominator = 100): ReturnType<typeof getPriceDifferenceWarning> =>
      getPriceDifferenceWarning({
        t: mockTFunction,
        priceDifference: new Percent(numerator, denominator),
        routing: TradingApi.Routing.CHAINED,
        formatPercent: mockFormatPercent,
      })

    it('does not warn below or at the raised medium threshold', () => {
      expect(getWarning(6)).toBeUndefined()
      expect(getWarning(75, 1000)).toBeUndefined() // exactly 7.5%
    })

    it('returns medium warning between the raised thresholds', () => {
      expect(getWarning(8)?.type).toBe(WarningLabel.PriceDifferenceMedium)
      expect(getWarning(8)?.severity).toBe(WarningSeverity.Medium)
    })

    it('returns high warning at or above the raised critical threshold', () => {
      expect(getWarning(15)?.type).toBe(WarningLabel.PriceDifferenceHigh)
      expect(getWarning(16)?.severity).toBe(WarningSeverity.High)
    })
  })

  describe('bridge routing', () => {
    const getWarning = (numerator: number, denominator = 100): ReturnType<typeof getPriceDifferenceWarning> =>
      getPriceDifferenceWarning({
        t: mockTFunction,
        priceDifference: new Percent(numerator, denominator),
        routing: TradingApi.Routing.BRIDGE,
        formatPercent: mockFormatPercent,
      })

    it('does not warn below or at the lowered medium threshold', () => {
      expect(getWarning(15, 1000)).toBeUndefined() // 1.5%
      expect(getWarning(2)).toBeUndefined() // exactly 2%
    })

    it('returns medium warning between the lowered thresholds', () => {
      expect(getWarning(3)?.type).toBe(WarningLabel.PriceDifferenceMedium)
      expect(getWarning(4)?.severity).toBe(WarningSeverity.Medium)
    })

    it('returns high warning at or above the lowered critical threshold', () => {
      expect(getWarning(5)?.type).toBe(WarningLabel.PriceDifferenceHigh)
      expect(getWarning(6)?.severity).toBe(WarningSeverity.High)
    })
  })
})
