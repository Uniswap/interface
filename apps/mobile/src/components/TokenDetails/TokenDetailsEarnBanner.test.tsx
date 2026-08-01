import type { PropsWithChildren, ReactNode } from 'react'
import { TokenDetailsEarnBanner } from 'src/components/TokenDetails/TokenDetailsEarnBanner'
import { render } from 'src/test/test-utils'
import type { TokenDetailsEarnData } from 'uniswap/src/features/earn/hooks/useTokenDetailsEarnData'
import type { EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'

const mockNavigate = vi.fn()
const mockNavigateToEarnVault = vi.fn()

vi.mock('src/app/navigation/types', (): { useAppStackNavigation: () => { navigate: typeof mockNavigate } } => ({
  useAppStackNavigation: (): { navigate: typeof mockNavigate } => ({ navigate: mockNavigate }),
}))

vi.mock('uniswap/src/components/tokenDetails/TokenDetailsEarnBanner', (): { TokenDetailsEarnBanner: () => null } => ({
  TokenDetailsEarnBanner: (): null => null,
}))

vi.mock(
  'uniswap/src/features/earn/hooks/useEarnDepositSources',
  (): {
    useEarnDepositSources: () => {
      balanceLookupErrored: boolean
      balanceLookupHasData: boolean
      balanceLookupSettled: boolean
      hasSupportedBalanceForUnderlying: boolean
      refetchBalanceLookup: ReturnType<typeof vi.fn>
    }
  } => ({
    useEarnDepositSources: (): {
      balanceLookupErrored: boolean
      balanceLookupHasData: boolean
      balanceLookupSettled: boolean
      hasSupportedBalanceForUnderlying: boolean
      refetchBalanceLookup: ReturnType<typeof vi.fn>
    } => ({
      balanceLookupErrored: false,
      balanceLookupHasData: true,
      balanceLookupSettled: true,
      hasSupportedBalanceForUnderlying: true,
      refetchBalanceLookup: vi.fn(),
    }),
  }),
)

vi.mock('uniswap/src/features/telemetry/send', (): { sendAnalyticsEvent: ReturnType<typeof vi.fn> } => ({
  sendAnalyticsEvent: vi.fn(),
}))

vi.mock(
  'wallet/src/contexts/WalletNavigationContext',
  (): {
    WalletNavigationProvider: ({ children }: PropsWithChildren) => ReactNode
    useWalletNavigation: () => { navigateToEarnVault: typeof mockNavigateToEarnVault }
  } => ({
    WalletNavigationProvider: ({ children }: PropsWithChildren): ReactNode => children,
    useWalletNavigation: (): { navigateToEarnVault: typeof mockNavigateToEarnVault } => ({
      navigateToEarnVault: mockNavigateToEarnVault,
    }),
  }),
)

const mockSendAnalyticsEvent = vi.mocked(sendAnalyticsEvent)

function createEarnData({ isLoggedIn }: { isLoggedIn: boolean }): TokenDetailsEarnData {
  return {
    balanceUsd: 100,
    earnPosition: undefined,
    earnVault: {
      id: 'vault-id',
      apyPercent: 5,
      displayCurrencyId: '1-0x0000000000000000000000000000000000000001',
    } as EarnVaultInfo,
    hasLoadedPositions: false,
    isError: false,
    isLoggedIn,
    projectedAnnualEarningsUsd: 5,
    refetch: vi.fn(),
    showEarnError: false,
    tokenSymbol: 'USDC',
    userHasEarnPosition: false,
  }
}

describe(TokenDetailsEarnBanner, (): void => {
  beforeEach((): void => {
    vi.clearAllMocks()
  })

  it('does not log a surface impression when logged out', (): void => {
    render(<TokenDetailsEarnBanner activeAddress={undefined} earnData={createEarnData({ isLoggedIn: false })} />)

    expect(mockSendAnalyticsEvent).not.toHaveBeenCalled()
  })
})
