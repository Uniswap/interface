import type { PropsWithChildren, ReactNode } from 'react'
import { TokenDetailsEarnBanner } from 'src/components/TokenDetails/TokenDetailsEarnBanner'
import { fireEvent, render, screen } from 'src/test/test-utils'
import { EarnEntryPoint } from 'uniswap/src/features/earn/analytics'
import type { TokenDetailsEarnData } from 'uniswap/src/features/earn/hooks/useTokenDetailsEarnData'
import type { EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import type { Mock } from 'vitest'

const mockNavigate = vi.fn()
const mockNavigateToEarnVault = vi.fn()
const mockRefetchBalanceLookup = vi.fn()

const depositSourcesMock = vi.hoisted(() => ({
  hasSupportedBalanceForUnderlying: true,
}))

const accountMock = vi.hoisted(() => ({
  isViewOnly: false,
}))

vi.mock('src/app/navigation/types', (): { useAppStackNavigation: () => { navigate: typeof mockNavigate } } => ({
  useAppStackNavigation: (): { navigate: typeof mockNavigate } => ({ navigate: mockNavigate }),
}))

vi.mock('uniswap/src/components/tokenDetails/TokenDetailsEarnBanner', async () => {
  const { Text } = await vi.importActual<typeof import('@universe/mycelium')>('@universe/mycelium')
  return {
    TokenDetailsEarnBanner: ({ onPress }: { onPress: () => void }) => (
      <Text testID="earn-banner" onPress={onPress}>
        Earn banner
      </Text>
    ),
  }
})

vi.mock(
  'uniswap/src/features/earn/hooks/useEarnDepositSources',
  (): {
    useEarnDepositSources: () => {
      balanceLookupErrored: boolean
      balanceLookupHasData: boolean
      balanceLookupSettled: boolean
      hasSupportedBalanceForUnderlying: boolean
      refetchBalanceLookup: typeof mockRefetchBalanceLookup
    }
  } => ({
    useEarnDepositSources: (): {
      balanceLookupErrored: boolean
      balanceLookupHasData: boolean
      balanceLookupSettled: boolean
      hasSupportedBalanceForUnderlying: boolean
      refetchBalanceLookup: typeof mockRefetchBalanceLookup
    } => ({
      balanceLookupErrored: false,
      balanceLookupHasData: true,
      balanceLookupSettled: true,
      hasSupportedBalanceForUnderlying: depositSourcesMock.hasSupportedBalanceForUnderlying,
      refetchBalanceLookup: mockRefetchBalanceLookup,
    }),
  }),
)

vi.mock('wallet/src/features/wallet/hooks', () => ({
  useIsViewOnlyWallet: (): boolean => accountMock.isViewOnly,
}))

vi.mock('uniswap/src/features/telemetry/send', (): { sendAnalyticsEvent: Mock } => ({
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
    hasLoadedPositions: true,
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
    depositSourcesMock.hasSupportedBalanceForUnderlying = true
    accountMock.isViewOnly = false
  })

  it('does not log a surface impression when logged out', (): void => {
    render(<TokenDetailsEarnBanner activeAddress={undefined} earnData={createEarnData({ isLoggedIn: false })} />)

    expect(mockSendAnalyticsEvent).not.toHaveBeenCalled()
  })

  it('routes a view-only wallet straight to the vault overview, skipping the balance lookup', (): void => {
    accountMock.isViewOnly = true
    depositSourcesMock.hasSupportedBalanceForUnderlying = false

    render(
      <TokenDetailsEarnBanner
        activeAddress="0x0000000000000000000000000000000000000001"
        earnData={createEarnData({ isLoggedIn: true })}
      />,
    )

    fireEvent.press(screen.getByTestId('earn-banner'))

    expect(mockNavigateToEarnVault).toHaveBeenCalledWith({
      analyticsEntryPoint: EarnEntryPoint.TokenDetailsEarnBanner,
      vault: expect.objectContaining({ id: 'vault-id' }),
    })
    // No acquisition detour and no balance refresh for view-only wallets.
    expect(mockNavigate).not.toHaveBeenCalled()
    expect(mockRefetchBalanceLookup).not.toHaveBeenCalled()
  })

  it('routes a signer wallet without supported balance to the acquisition flow', (): void => {
    depositSourcesMock.hasSupportedBalanceForUnderlying = false

    render(
      <TokenDetailsEarnBanner
        activeAddress="0x0000000000000000000000000000000000000001"
        earnData={createEarnData({ isLoggedIn: true })}
      />,
    )

    fireEvent.press(screen.getByTestId('earn-banner'))

    expect(mockRefetchBalanceLookup).toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalledWith(ModalName.EarnYouNeedToken, {
      currencyId: '1-0x0000000000000000000000000000000000000001',
    })
    expect(mockNavigateToEarnVault).not.toHaveBeenCalled()
  })
})
