import { ONE_MINUTE_MS } from 'utilities/src/time/time'
import { shouldSendBalanceReport } from 'wallet/src/features/telemetry/utils/balanceReporter'

jest.mock('uniswap/src/features/accounts/reportBalancesForAnalytics', () => ({
  hasRequiredDataForBalancesReport: jest.fn(),
}))

describe('shouldSendBalanceReport', () => {
  const mockCurrentTime = Date.now()
  const FIVE_MINUTES = ONE_MINUTE_MS * 5

  beforeEach(() => {
    jest.clearAllMocks()
    const module = require('uniswap/src/features/accounts/reportBalancesForAnalytics')
    ;(module.hasRequiredDataForBalancesReport as jest.Mock).mockReturnValue(true)
  })

  describe('when data is valid', () => {
    it('should return true when wallet was just funded', () => {
      const result = shouldSendBalanceReport({
        lastReport: mockCurrentTime - ONE_MINUTE_MS, // Recent report
        lastValue: 0,
        totalBalance: 100,
        totalBalancesUsdPerChain: { '1': 100 },
        wallets: ['0x123'],
        wallet: '0x123',
        accountBalances: [100],
      })
      expect(result).toBe(true)
    })

    it('should return true when report is due after 5 minutes', () => {
      const result = shouldSendBalanceReport({
        lastReport: mockCurrentTime - FIVE_MINUTES - 1000, // Over 5 minutes ago
        lastValue: 100,
        totalBalance: 100,
        totalBalancesUsdPerChain: { '1': 100 },
        wallets: ['0x123'],
        wallet: '0x123',
        accountBalances: [100],
      })
      expect(result).toBe(true)
    })

    it('should return false when report is not due and wallet was not just funded', () => {
      const result = shouldSendBalanceReport({
        lastReport: mockCurrentTime - ONE_MINUTE_MS, // Recent report
        lastValue: 100,
        totalBalance: 150,
        totalBalancesUsdPerChain: { '1': 150 },
        wallets: ['0x123'],
        wallet: '0x123',
        accountBalances: [100],
      })
      expect(result).toBe(false)
    })

    it('should handle undefined lastValue as unfunded', () => {
      const result = shouldSendBalanceReport({
        lastReport: mockCurrentTime - ONE_MINUTE_MS,
        lastValue: undefined,
        totalBalance: 100,
        totalBalancesUsdPerChain: { '1': 100 },
        wallets: ['0x123'],
        wallet: '0x123',
        accountBalances: [100],
      })
      expect(result).toBe(true)
    })

    it('should handle undefined lastReport as never reported', () => {
      const result = shouldSendBalanceReport({
        lastReport: undefined,
        lastValue: 100,
        totalBalance: 100,
        totalBalancesUsdPerChain: { '1': 100 },
        wallets: ['0x123'],
        wallet: '0x123',
        accountBalances: [100],
      })
      expect(result).toBe(true)
    })
  })

  describe('when data is invalid', () => {
    it('should return false when required data validation fails', () => {
      const module = require('uniswap/src/features/accounts/reportBalancesForAnalytics')
      ;(module.hasRequiredDataForBalancesReport as jest.Mock).mockReturnValue(false)

      const result = shouldSendBalanceReport({
        lastReport: mockCurrentTime - FIVE_MINUTES - 1000,
        lastValue: 0,
        totalBalance: 100,
        totalBalancesUsdPerChain: undefined,
        wallets: [],
        wallet: undefined,
        accountBalances: [100],
      })
      expect(result).toBe(false)
    })
  })
})
