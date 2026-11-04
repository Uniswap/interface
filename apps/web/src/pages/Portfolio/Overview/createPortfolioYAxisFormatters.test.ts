import { createPortfolioYAxisFormatters } from '~/pages/Portfolio/Overview/createPortfolioYAxisFormatters'

describe(createPortfolioYAxisFormatters, () => {
  const { yAxisFormatter, yAxisTickmarksFormatter } = createPortfolioYAxisFormatters({
    locale: 'en-US',
    currency: 'USD',
  })

  describe('yAxisTickmarksFormatter', () => {
    it('drops decimals when every tick is a whole number', () => {
      expect(yAxisTickmarksFormatter([30200, 30400, 30600])).toEqual(['$30,200', '$30,400', '$30,600'])
    })

    it('shows cents on every tick when any tick has them', () => {
      expect(yAxisTickmarksFormatter([9.99, 10, 10.01, 10.02])).toEqual(['$9.99', '$10.00', '$10.01', '$10.02'])
    })

    it('treats float noise from tick stepping as the intended value', () => {
      expect(yAxisTickmarksFormatter([10.009999999999, 10.000000000001])).toEqual(['$10.01', '$10.00'])
      expect(yAxisTickmarksFormatter([11.999999999999, 14.000000000001])).toEqual(['$12', '$14'])
    })
  })

  describe('yAxisFormatter', () => {
    it('keeps cents on a fractional value instead of flooring it', () => {
      expect(yAxisFormatter(10.05)).toBe('$10.05')
      expect(yAxisFormatter(30200)).toBe('$30,200')
    })
  })
})
