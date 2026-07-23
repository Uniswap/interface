import { waitFor } from '@testing-library/react-native'
import * as reactRedux from 'react-redux'
import * as balanceUtils from 'uniswap/src/data/balances/utils'
import * as reportBalancesForAnalytics from 'uniswap/src/features/accounts/reportBalancesForAnalytics'
import { AccountType } from 'uniswap/src/features/accounts/types'
import * as telemetrySend from 'uniswap/src/features/telemetry/send'
import * as walletHooks from 'uniswap/src/features/wallet/hooks/useWallet'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'
import type { Mock } from 'vitest'
import { useLastBalancesReporter } from 'wallet/src/features/telemetry/hooks/useLastBalancesReporter'
import * as portfolioData from 'wallet/src/features/telemetry/hooks/usePortfolioDataForReporting'
import * as balanceReporter from 'wallet/src/features/telemetry/utils/balanceReporter'
import * as walletFundingDetector from 'wallet/src/features/telemetry/utils/walletFundingDetector'
import { renderHook } from 'wallet/src/test/test-utils'

vi.mock('react-redux', async () => ({
  ...(await vi.importActual('react-redux')),
  useDispatch: vi.fn(),
  useSelector: vi.fn(),
}))

vi.mock('wallet/src/features/telemetry/hooks/usePortfolioDataForReporting')
vi.mock('wallet/src/features/telemetry/utils/walletFundingDetector', () => ({
  isWalletJustFunded: vi.fn(),
}))
vi.mock('wallet/src/features/telemetry/utils/balanceReporter')

vi.mock('uniswap/src/data/balances/utils', async () => ({
  ...(await vi.importActual('uniswap/src/data/balances/utils')),
  calculateTotalBalancesUsdPerChainRest: vi.fn(),
}))
vi.mock('uniswap/src/features/accounts/reportBalancesForAnalytics', () => ({
  reportBalancesForAnalytics: vi.fn(),
  hasRequiredDataForBalancesReport: vi.fn().mockReturnValue(true),
}))

function mockSelector(selector: { name?: string }): number | boolean | undefined {
  const selectorName = selector.name || ''
  if (selectorName.includes('LastBalancesReport') && !selectorName.includes('Value')) {
    return Date.now() - ONE_MINUTE_MS * 10
  }
  if (selectorName.includes('LastBalancesReportValue')) {
    return 0
  }
  if (selectorName.includes('WalletIsFunded')) {
    return false
  }
  return undefined
}

const mockAccount = {
  address: '0x123',
  accountType: AccountType.SignerMnemonic,
}

const mockTotalBalance = 300
const mockTotalBalancesUsdPerChain = { '1': 150, '42161': 150 }

describe('useLastBalancesReporter', () => {
  let mockDispatch: Mock

  beforeEach(() => {
    vi.clearAllMocks()

    mockDispatch = vi.fn()
    ;(reactRedux.useDispatch as Mock).mockReturnValue(mockDispatch)

    ;(portfolioData.usePortfolioDataForReporting as Mock).mockReturnValue({
      portfolioQuery: {
        data: { positions: [] },
        isLoading: false,
        error: null,
      },
      signerAccountAddresses: [],
      balances: [],
      totalBalance: mockTotalBalance,
      totalBalancesUsdPerChain: mockTotalBalancesUsdPerChain,
    })

    ;(balanceReporter.shouldSendBalanceReport as Mock).mockReturnValue(false)

    vi.spyOn(telemetrySend, 'sendAnalyticsEvent').mockImplementation(() => undefined)

    vi.spyOn(walletHooks, 'useWallet').mockReturnValue({
      evmAccount: mockAccount,
    } as ReturnType<typeof walletHooks.useWallet>)
    ;(reactRedux.useSelector as Mock).mockImplementation((selector: unknown) =>
      mockSelector(selector as { name?: string }),
    )

    ;(balanceUtils.calculateTotalBalancesUsdPerChainRest as Mock).mockReturnValue(mockTotalBalancesUsdPerChain)
  })

  describe('Query configuration', () => {
    it('should use correct data hooks', async () => {
      renderHook(() => useLastBalancesReporter({ isOnboarded: true }))

      await waitFor(() => {
        expect(portfolioData.usePortfolioDataForReporting).toHaveBeenCalled()
      })
    })

    it('should report balances when conditions are met', async () => {
      const mockReportBalancesForAnalytics = vi.fn()
      vi.spyOn(reportBalancesForAnalytics, 'reportBalancesForAnalytics').mockImplementation(
        mockReportBalancesForAnalytics,
      )

      // Mock shouldSendBalanceReport to return true
      ;(balanceReporter.shouldSendBalanceReport as Mock).mockReturnValue(true)

      renderHook(() => useLastBalancesReporter({ isOnboarded: true }))

      await waitFor(() => {
        expect(mockReportBalancesForAnalytics).toHaveBeenCalled()
      })
    })

    it('should not report when loading', async () => {
      const mockReportBalancesForAnalytics = vi.fn()
      vi.spyOn(reportBalancesForAnalytics, 'reportBalancesForAnalytics').mockImplementation(
        mockReportBalancesForAnalytics,
      )

      ;(portfolioData.usePortfolioDataForReporting as Mock).mockReturnValue({
        portfolioQuery: {
          data: undefined,
          isLoading: true,
          error: null,
        },
        signerAccountAddresses: [],
        balances: [],
        totalBalance: 0,
        totalBalancesUsdPerChain: undefined,
      })

      renderHook(() => useLastBalancesReporter({ isOnboarded: true }))

      await waitFor(() => {
        expect(mockReportBalancesForAnalytics).not.toHaveBeenCalled()
      })
    })
  })

  describe('Wallet funded detection', () => {
    it('should detect and report when wallet gets funded', async () => {
      const mockSelectorForWalletFunding = (selector: { name?: string }): number | boolean | undefined => {
        const selectorName = selector.name || ''
        if (selectorName.includes('WalletIsFunded')) {
          return false
        }
        if (selectorName.includes('LastBalancesReport') && !selectorName.includes('Value')) {
          return Date.now() - ONE_MINUTE_MS * 10
        }
        if (selectorName.includes('LastBalancesReportValue')) {
          return 0
        }
        return undefined
      }

      ;(reactRedux.useSelector as Mock).mockImplementation((selector: unknown) =>
        mockSelectorForWalletFunding(selector as { name?: string }),
      )

      // Ensure wallet is properly mocked
      vi.spyOn(walletHooks, 'useWallet').mockReturnValue({
        evmAccount: mockAccount,
      } as ReturnType<typeof walletHooks.useWallet>)

      // Mock portfolioData with proper totalBalance
      ;(portfolioData.usePortfolioDataForReporting as Mock).mockReturnValue({
        portfolioQuery: {
          data: { positions: [] },
          isLoading: false,
          error: null,
        },
        signerAccountAddresses: [],
        balances: [],
        totalBalance: mockTotalBalance,
        totalBalancesUsdPerChain: mockTotalBalancesUsdPerChain,
      })

      // Mock isWalletJustFunded to return true
      ;(walletFundingDetector.isWalletJustFunded as Mock).mockReturnValue(true)

      const mockSendAppsFlyerEvent = vi.fn().mockResolvedValue(undefined)
      vi.spyOn(telemetrySend, 'sendAppsFlyerEvent').mockImplementation(mockSendAppsFlyerEvent)

      renderHook(() => useLastBalancesReporter({ isOnboarded: true }))

      // Give the effect some time to run
      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith(
          expect.objectContaining({
            type: expect.stringContaining('recordWalletFunded'),
          }),
        )
      })

      expect(mockSendAppsFlyerEvent).toHaveBeenCalledWith(expect.anything(), { sumOfFunds: mockTotalBalance })
    })
  })
})
